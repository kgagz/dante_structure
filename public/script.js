// Load data first, then initialize visualization
fetch("restructured_commedia.json")
  .then(response => response.json())
  .then(data => {
    console.log(data);

    // Initialize the visualization with transformed data
    initializeVisualization(data);
  })
  .catch(error => console.error("Error fetching JSON:", error));

function initializeVisualization(bookData) {
  // DOM elements
  const width = 800;
  const height = 500;
  const margin = { top: 50, right: 40, bottom: 60, left: 60 };

  // Create svg element
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Create main container group that will be transformed during zooming
  const g = svg.append("g")
    .attr("class", "main-container");

  // Add title element
  const title = svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Book Series Word Counts");

  // Add back button (initially hidden)
  const backButton = svg.append("g")
    .attr("class", "back-button")
    .attr("transform", `translate(70, 30)`)
    .style("cursor", "pointer")
    .style("opacity", 0)
    .on("click", goBack);

  backButton.append("rect")
    .attr("x", -50)
    .attr("y", -20)
    .attr("width", 100)
    .attr("height", 30)
    .attr("rx", 5)
    .attr("fill", "#f0f0f0")
    .attr("stroke", "#ccc");

  backButton.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text("← Back");

  // Navigation state
  let currentLevel = "canticles";
  let currentParent = null;
  let navigationHistory = [];
  let currentZoomTarget = null;

  // Setup zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on("zoom", zoomed);

  svg.call(zoom);

  // Function to handle zoom event
  function zoomed(event) {
    g.attr("transform", event.transform);
  }

  // Initialize with book-level view
  renderCanticles(bookData.children || []);

  // Function to render books view
  function renderCanticles(canticles) {
    // Check if books is defined and has items
    if (!canticles || canticles.length === 0) {
      console.error("No canticle data available to render");
      return;
    }
    
    currentLevel = "canticles";
    updateTitle("Divine Comedy - Canticles");
    
    // Reset zoom transform
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Remove any existing bars
    g.selectAll(".bar-group").remove();
    
    // Horizontal bar setup for Canticles
    const x = d3.scaleLinear()
      .domain([0, d3.max(canticles, d => d.cantoCount)])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(canticles.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    // Axes
    const xAxis = g => g
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x).ticks(null, "s"));

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Remove previous axes
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();
    
    // Add new axes
    g.append("g")
      .attr("class", "x-axis")
      .call(xAxis);
    
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
    
    // Create bar groups
    const barGroups = g.append("g")
      .attr("class", "bar-group")
      .selectAll("g")
      .data(canticles)
      .join("g");

    // Add bars (with click handler)
    barGroups.append("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.name))
      .attr("width", d => x(d.cantoCount) - x(0))
      .attr("height", y.bandwidth())
      .attr("fill", "#6495ED")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        currentParent = d;
        navigationHistory.push({ level: "canticles", parent: null });

        // Horizontal layout: centerY is vertical center of the bar
        const centerX = x(d.cantoCount); // center of bar horizontally
        const centerY = y(d.name) + y.bandwidth() / 2; // vertical center of the bar

        zoomToElement(centerX, centerY, 2.5, () => {
          renderCantos(d.children, d.name);
        });
      });

    

    /*barGroups.append("text")
      .attr("x", d => x(d.cantoCount) + 5)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .text(d => `${d.cantoCount} cantos`)
      .style("font-size", "11px")
      .style("fill", "#555");
    */
    
    // Hide back button
    backButton.transition().duration(300).style("opacity", 0);
  }

  // Function to render chapters view
  function renderCantos(cantos, canticleName) {
    if (!cantos || cantos.length === 0) {
      console.error("No canto data available to render");
      return;
    }
    
    currentLevel = "cantos";
    updateTitle(`Cantos of ${canticleName}`);
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Remove any existing bars
    g.selectAll(".bar-group").remove();
    
    // Create scales
    const x = d3.scaleBand()
      .domain(cantos.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(cantos, d => d.lineCount)])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Update axes
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle");
    
    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Line Count"));
    
    // Remove previous axes
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();
    
    // Add new axes
    g.append("g")
      .attr("class", "x-axis")
      .call(xAxis);
    
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
    
    // Create bar groups
    const barGroups = g.append("g")
      .attr("class", "bar-group")
      .selectAll("g")
      .data(cantos)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        navigationHistory.push({ level: "cantos", parent: currentParent });
        currentParent = d;
        
        // Store the position to zoom to
        const centerX = x(d.name) + x.bandwidth() / 2;
        const centerY = y(d.lineCount) / 2;
        
        // Perform zoom transition then render pages
        zoomToElement(centerX, centerY, 2.5, () => {
          renderLines(d.children, d.name, canticleName);
        });
      });
    
    // Add bars with transition
    barGroups.append("rect")
      .attr("x", d => x(d.name))
      .attr("y", height - margin.bottom)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "#82CA9D")
      .transition()
      .duration(750)
      .attr("y", d => y(d.lineCount))
      .attr("height", d => y(0) - y(d.lineCount));
    
    /*/ Add labels
    barGroups.append("text")
      .attr("x", d => x(d.name) + x.bandwidth() / 2)
      .attr("y", d => y(d.lineCount) - 5)
      .attr("text-anchor", "middle")
      .attr("opacity", 0)
      .text(d => d3.format(",")(d.lineCount))
      .style("font-size", "12px")
      .transition()
      .delay(300)
      .duration(400)
      .attr("opacity", 1);*/
    
    // Show back button
    backButton.transition().duration(300).style("opacity", 1);
  }

  // Function to render pages view
  function renderLines(lines, cantoName, canticleName) {
    if (!lines || lines.length === 0) {
      console.error("No line data available to render");
      return;
    }
    
    currentLevel = "lines";
    updateTitle(`Lines in ${cantoName} - (${canticleName})`);
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Remove any existing bars
    g.selectAll(".bar-group").remove();
    
    const x = d3.scaleLinear()
      .domain([0, d3.max(lines, d => d.wordCount)])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(lines.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    const xAxis = g => g
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x));

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    
    // Remove previous axes
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();
    
    // Add new axes
    g.append("g")
      .attr("class", "x-axis")
      .call(xAxis);
    
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
    
    // Create bar groups with transition
    const barGroups = g.append("g")
      .attr("class", "bar-group")
      .selectAll("g")
      .data(lines)
      .join("g");
    
    barGroups.append("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.name))
      .attr("width", d => x(d.wordCount) - x(0))
      .attr("height", y.bandwidth())
      .attr("fill", "#FD8D3C");

    /*barGroups.append("text")
      .attr("x", d => x(d.wordCount) + 5)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .text(d => d.wordCount)
      .style("font-size", "10px");*/

    
    // Show back button
    backButton.transition().duration(300).style("opacity", 1);
  }

  // Function to handle back button clicks
  function goBack() {
    if (navigationHistory.length === 0) return;
    
    const previous = navigationHistory.pop();
    
    // Zoom out first, then render previous view
    zoomToElement(width / 2, height / 2, 1, () => {
      if (previous.level === "canticles") {
        renderCanticles(bookData.children || []);
      } else if (previous.level === "cantos") {
        currentParent = previous.parent;
        if (currentParent && currentParent.children) {
          renderCantos(currentParent.children, currentParent.name);
        } else {
          console.error("Invalid parent data for cantos view");
          renderCanticles(bookData.children || []);
        }
      }
    });
  }

  // Function to zoom to a specific element
  function zoomToElement(x, y, scale, callback) {
    svg.transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2 - x * scale, height / 2 - y * scale / 2)
          .scale(scale)
      )
      .on("end", callback);
  }

  // Add double-click behavior to the SVG for resetting the zoom
  svg.on("dblclick", () => {
    if (currentLevel === "books") return;
    
    goBack();
  });

  // Update chart title
  function updateTitle(text) {
    title.text(text);
  }

  // Add zoom controls
  const zoomControls = svg.append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width - 100}, 30)`);

  // Zoom in button
  const zoomInButton = zoomControls.append("g")
    .attr("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    });

  zoomInButton.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", 30)
    .attr("rx", 5)
    .attr("fill", "#f0f0f0")
    .attr("stroke", "#ccc");

  zoomInButton.append("text")
    .attr("x", 15)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "20px")
    .text("+");

  // Zoom out button
  const zoomOutButton = zoomControls.append("g")
    .attr("cursor", "pointer")
    .attr("transform", "translate(40, 0)")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.75);
    });

  zoomOutButton.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", 30)
    .attr("rx", 5)
    .attr("fill", "#f0f0f0")
    .attr("stroke", "#ccc");

  zoomOutButton.append("text")
    .attr("x", 15)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "20px")
    .text("−");

  // Add the SVG to the DOM
  document.getElementById("chart-container").appendChild(svg.node());
}