// Load data first, then initialize visualization
fetch("restructured_commedia.json")
  .then(response => response.json())
  .then(data => {
    console.log(data);

    // Initialize the visualization with transformed data
    initializeVisualization(data);
  })
  .catch(error => console.error("Error fetching JSON:", error));

const canticleColors = {
  Inferno: "#d73027",     // Fiery red
  Purgatorio: "#1a9850",  // Green
  Paradiso: "#91bfdb"     // Light blue
};

function initializeVisualization(bookData) {
  // DOM elements

  let isNavigating = false;

  
  const container = document.getElementById("chart-container");
  const width = container.clientWidth;
  const height = container.clientHeight;
  window.addEventListener("resize", () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    // Re-render or update chart dimensions here
  });

    // Create svg element
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 90%; height: 90%;");
  
  const margin = { top: 50, right: 80, bottom: 60, left: 80 };


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
    .text("Divine Comedy Word Counts");

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

  // Improved navigation state tracking
  let currentLevel = "canticles";
  let currentParent = null;
  let navigationHistory = [];

  /* Navigation history structure:
   * Each entry is an object with:
   * - level: The level we were at ("canticles", "cantos", "lines", "words")
   * - parent: The data object containing children for this level
   * - name: Name of the current item (canticle/canto/line)
   * - parentName: Name of the parent item (for proper titles)
   * - ancestors: Array of names from top level to current for better context
   */

  // Setup zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 8])
    .on("zoom", zoomed);

  svg.call(zoom);

  // Function to handle zoom event
  function zoomed(event) {
    g.attr("transform", event.transform);
  }

  // Initialize with canticle-level view
  renderCanticles(bookData.children || []);

  function renderCanticles(canticles) {
    if (!canticles || canticles.length === 0) {
      console.error("No canticle data available to render");
      return;
    }

    // Reset navigation
    navigationHistory = [];
    currentLevel = "canticles";
    currentParent = bookData;
    updateTitle("Divine Comedy - Canticles");

    // Reset zoom
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);

    // Clear old elements
    g.selectAll(".y-axis-label").remove();
    d3.selectAll(".tooltip").remove();
    g.selectAll(".bar-group").remove();
    g.selectAll(".x-axis").remove(); // remove top x-axis
    g.selectAll(".y-axis").remove();

    // Sort canticles
    const canticleOrder = ["Inferno", "Purgatorio", "Paradiso"];
    canticles.sort((a, b) =>
      canticleOrder.indexOf(a.name) - canticleOrder.indexOf(b.name)
    );

    const maxCantoCount = d3.max(canticles, d => d.children.length);
    const allLineCounts = canticles.flatMap(d => d.children.map(c => c.lineCount));
    const maxLineCount = d3.max(allLineCounts);
    const minLineCount = d3.min(allLineCounts);

    // Horizontal scale — flush right: start bars from the RIGHT edge
    const x = d3.scaleLinear()
      .domain([0, maxCantoCount])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(canticles.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    const heightScale = d3.scaleLinear()
      .domain([minLineCount - 5, maxLineCount])
      .range([4, y.bandwidth()]);

    const barGroup = g.append("g").attr("class", "bar-group");

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff5cc")
      .style("border", "1px solid #999")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-family", "'IM Fell English SC', serif")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("display", "none");

    const canticleGroups = barGroup.selectAll(".canticle")
      .data(canticles)
      .join("g")
      .attr("class", "canticle")
      .attr("transform", d => `translate(0, ${y(d.name)})`);

    canticleGroups.each(function (canticle) {
      const group = d3.select(this);
      const cantoCount = canticle.children.length;
      const segmentWidth = (x(1) - x(0)) * 1.2;

      group.selectAll(".canto-bar")
        .data(canticle.children)
        .join("rect")
        .attr("class", "canto-bar")
        .attr("x", (d, i) => x(maxCantoCount - cantoCount + i)) // right-aligned
        .attr("y", d => y.bandwidth() - heightScale(d.lineCount))
        .attr("width", segmentWidth)
        .attr("height", d => heightScale(d.lineCount))
        .attr("fill", d => canticleColors[canticle.name] || "#6495ED")
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          tooltip.style("display", "none");
          navigationHistory.push({
            level: "canticles",
            parent: bookData,
            name: canticle.name,
            ancestors: ["Divine Comedy", canticle.name]
          });
          currentParent = canticle;
          currentLevel = "cantos";
          renderCantos(canticle.children, canticle.name);
        })
        .on("mouseover", (event, d, i) => {
          tooltip
            .style("display", "block")
            .html(`<strong>Canto ${d.name}</strong><br>${d.lineCount} lines`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        });
    });

    // Y-axis (canticle names)
    g.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
    
    // ✅ Top x-axis intentionally removed

    // Hide back button
    backButton.transition().duration(300).style("opacity", 0);
  }


  function renderCantos(cantos, canticleName) {
    if (!cantos || cantos.length === 0) {
      console.error("No canto data available to render");
      return;
    }

    currentLevel = "cantos";
    updateTitle(`${canticleName}`);
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);

    
    // Clear previous elements
    g.selectAll(".y-axis-label").remove();
    d3.selectAll(".tooltip").remove();
    g.selectAll(".bar-group").remove();
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();

    const chartWidth = width - margin.left - margin.right;
    backButton.transition().duration(300).style("opacity", 1);
    const chartHeight = height - margin.top - margin.bottom;

    const maxLines = d3.max(cantos, d => d.children.length);
    const maxWords = d3.max(cantos.flatMap(c => c.children.map(l => l.wordCount)));

    const centerY = margin.top + (height - margin.top - margin.bottom) / 2;
    const maxLinesInAnyCanto = d3.max(cantos, d => d.children.length);
    const halfChartHeight = (height - margin.top - margin.bottom) / 2;
    const segmentHeight = halfChartHeight / maxLinesInAnyCanto;

    // One vertical bar per canto
    const x = d3.scaleBand()
      .domain(cantos.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    // Line height scale for stacking upward
    const lineHeightScale = d3.scaleLinear()
      .domain([0, maxLines])
      .range([0, chartHeight]);

    // Word count width scale (controls jagged edge)
    const wordScale = d3.scaleLinear()
      .domain([0, maxWords])
      .range([0, x.bandwidth()]);
    
    const barGroup = g.append("g")
      .attr("class", "bar-group");

    const cantoGroups = barGroup.selectAll(".canto")
      .data(cantos)
      .join("g")
      .attr("class", "canto")
      .attr("transform", d => `translate(${x(d.name)}, ${centerY})`);

    cantoGroups.each(function (canto) {
      const group = d3.select(this);
      const lines = canto.children;
      const segmentHeight = (chartHeight / maxLines);

      const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff5cc")
      .style("border", "1px solid #999")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-family", "'IM Fell English SC', serif")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("display", "none");

    const middle = Math.floor(lines.length / 2);

    group.selectAll(".line-segment")
      .data(lines)
      .join("rect")
      .attr("class", "line-segment")
      .attr("x", 0)
      .attr("width", d => wordScale(d.wordCount))
      .attr("y", (d, i) => {
          const middle = Math.floor(lines.length / 2);
          return (i - middle) * -segmentHeight;
        })
      .attr("height", segmentHeight)      
      .attr("fill", d => canticleColors[canticleName] || "#6495ED")
      .attr("cursor", "pointer")
      .on("mouseover", (event, line) => {
        tooltip
          .style("display", "block")
          .html(`<strong>Canto ${canto.name}</strong><br>${lines.length} lines`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      })
      .on("click", (event, line) => {
        event.stopPropagation();
        tooltip.style("display", "none");
      
        // Improved navigation history tracking
        navigationHistory.push({ 
          level: "cantos", 
          parent: currentParent, 
          name: canto.name,
          parentName: canticleName,
          ancestors: navigationHistory.length > 0 ? 
            [...navigationHistory[navigationHistory.length-1].ancestors, canto.name] : 
            ["Divine Comedy", canticleName, d.name]
        });
        
        currentParent = canto;
        currentLevel = "lines";
        
        
        // Perform zoom transition then render lines
        renderLines(canto.children, canto.name, canticleName);
        
      });

      // Optional: add canto label below bar
      group.append("text")
      .attr("x", x.bandwidth() / 2)
      .attr("y", chartHeight / 2 + 20) // place below the bottom edge
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-family", "'IM Fell English SC', serif")
      .text(canto.name);

    });

    // Axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", d => `translate(${x(d.name)}, ${centerY})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(6));

    backButton.transition().duration(300).style("opacity", 1);

    // // // // //
  }

  function renderLines(lines, cantoName, canticleName) {
    if (!lines || lines.length === 0) {
      console.error("No line data available to render");
      return;
    }
    
    currentLevel = "lines";
    updateTitle(`${canticleName} ${cantoName}`);
    
    // Clear previous elements
    g.selectAll(".y-axis-label").remove();
    d3.selectAll(".tooltip").remove();
    g.selectAll(".bar-group").remove();
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();
    
    const x = d3.scaleLinear()
      .domain([0, d3.max(lines, d => d.wordCount)])
      .nice()
      .range([margin.left, (width - margin.right) * 0.25]);

    const y = d3.scaleBand()
      .domain(lines.map(d => d.name))
      .range([margin.top, (height - margin.bottom) * 4])
      .padding(0.1);

    const xAxis = g => g
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x));

    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
    
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
      .data(lines)
      .join("g");
    
    const bars = barGroups.append("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.name))
      .attr("width", 0) // start with width 0 for transition
      .attr("height", y.bandwidth())
      .attr("fill", d => canticleColors[canticleName] || "#6495ED")
      .attr("cursor", "pointer");

    // Attach click handler BEFORE transition
    bars.on("click", (event, d) => {
      event.stopPropagation()
      // Improved navigation history tracking
      navigationHistory.push({ 
        level: "lines", 
        parent: currentParent, 
        name: d.name,
        parentName: cantoName,
        grandparentName: canticleName,
        ancestors: navigationHistory.length > 0 ? 
          [...navigationHistory[navigationHistory.length-1].ancestors, d.name] : 
          ["Divine Comedy", canticleName, cantoName, d.name]
      });
      
      currentParent = d;
      currentLevel = "words";
      renderWords(d.children, d.name, cantoName, canticleName);
    });

    // Apply transition
    bars.transition()
      .duration(750)
      .attr("width", d => x(d.wordCount) - x(0));
    
    // Add left-aligned text inside the bar
    barGroups.append("text")
      .attr("x", x(0) + 4)
      .attr("y", d => y(d.name) + y.bandwidth() / 2) // ← this is the missing part!
      .attr("dy", "0.35em")
      .attr("fill", d => (x(d.wordCount) - x(0)) > 40 ? "white" : "#333")
      .attr("font-size", "12px")
      .attr("font-family", "'IM Fell English SC', serif")
      .attr("pointer-events", "none")
      .text(d => 
          d.first_letter 
            ? d.first_letter.charAt(0).toUpperCase() + d.first_letter.slice(1) 
            : ""
        );


    // Add right-aligned text outside the bar
    const outerLabels = barGroups.append("text")
      .attr("x", x(0)) // start from x(0) so it moves smoothly
      .attr("y", d => y(d.name) + y.bandwidth() / 2) // ← this is the missing part!
      .attr("dy", "0.35em")
      .attr("fill", "#333")
      .attr("font-family", "'IM Fell English SC', serif")
      .attr("font-size", "12px")
      .attr("pointer-events", "none")
      .text(d => `${d.rhyme}`)
      .transition()
      .duration(750)
      .attr("x", d => x(d.wordCount) + 6); // animate to final position


    outerLabels.transition()
      .duration(750)
      .attr("x", d => x(d.wordCount) + 6); // animate to correct position

    
    // Show back button
    backButton.transition().duration(300).style("opacity", 1);
  }

  function renderWords(words, lineNum, cantoName, canticleName) {
    if (!words || words.length === 0) {
      console.error("No word data available to render");
      return;
    }
    
    currentLevel = "words";
    updateTitle(`${canticleName} ${cantoName}, Line ${lineNum}`);
    
    // Clear previous elements
    g.selectAll(".bar-group").remove();
    g.selectAll(".y-axis-label").remove();
    d3.selectAll(".tooltip").remove();
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();
    
    // Create scales
    const x = d3.scaleBand()
      .domain(words.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(words, d => d.syllCount)])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Update axes
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("font-family", "'IM Fell English SC', serif")
      .style("text-anchor", "middle");
    
    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(d3.max(words, d => d.syllCount)).tickFormat(d3.format("d")))
      .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("font-family", "'IM Fell English SC', serif")
        .attr("fill", "currentColor")
        .attr("text-anchor", "start"));

    
    // Add new axes
    g.append("g")
      .attr("class", "x-axis")
      .call(xAxis);
    
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
    
    g.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
      .attr("y", margin.left - 40) // adjust as needed
      .attr("font-family", "'IM Fell English SC', serif")
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .text("Syllable Count");

    
    // Create bar groups
    const barGroups = g.append("g")
      .attr("class", "bar-group")
      .selectAll("g")
      .data(words)
      .join("g")
      .attr("cursor", "pointer");
    
    // Add bars with transition
    barGroups.append("rect")
      .attr("x", d => x(d.name))
      .attr("y", height - margin.bottom)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", d => canticleColors[canticleName] || "#6495ED")
      .transition()
      .duration(750)
      .attr("y", d => y(d.syllCount))
      .attr("height", d => y(0) - y(d.syllCount));
    
    // Add text for each bar
    barGroups.append("text")
      .text(d => d.text)  // Use each word's .text
      .attr("x", d => x(d.name) + x.bandwidth() / 2)
      .attr("y", d => y(d.syllCount) + 14)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-family", "'IM Fell English SC', serif")
      .attr("pointer-events", "none");
    
    // Show back button
    backButton.transition().duration(300).style("opacity", 1);
  }

  // Completely rewritten goBack function with better error handling
  function goBack() {
    if (isNavigating) {
      console.log("Currently busy navigating...");
      return;
    }
    if (navigationHistory.length === 0) {
      console.log("No navigation history available");
      return;
    }

    isNavigating = true; // lock navigation
    // Show back button
    backButton.transition().duration(300).style("opacity", 0);
    
    // Pop the most recent navigation state
    const previous = navigationHistory.pop();
    console.log("Going back from:", currentLevel, "to:", previous.level);
    
    // Reset zoom first
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity)
      .on("end", () => {
        // After zoom completes, handle navigation based on the previous level
        switch (previous.level) {
          case "canticles":
            // Going back to the canticles view
            currentLevel = "canticles";
            currentParent = bookData;  // Top-level parent
            renderCanticles(bookData.children);
            break;
            
          case "cantos":
            // Going back to cantos view from lines view
            if (!previous.parent || !previous.parent.children) {
              console.error("Invalid parent data for cantos view");
              // Fallback to canticles view
              renderCanticles(bookData.children);
              return;
            }
            
            currentLevel = "cantos";
            currentParent = previous.parent;
            renderCantos(previous.parent.children, previous.parentName || "Unknown Canticle");
            break;
            
          case "lines":
            // Going back to lines view from words view
            if (!previous.parent || !previous.parent.children) {
              console.error("Invalid parent data for lines view");
              // Try to fallback to cantos if possible
              if (navigationHistory.length > 0) {
                const cantosState = navigationHistory[navigationHistory.length - 1];
                renderCantos(cantosState.parent.children, cantosState.parentName);
              } else {
                renderCanticles(bookData.children);
              }
              return;
            }
            
            currentLevel = "lines";
            currentParent = previous.parent;
            renderLines(
              previous.parent.children, 
              previous.parentName || "Unknown Canto", 
              previous.grandparentName || 
                (navigationHistory.length > 0 ? navigationHistory[navigationHistory.length-1].parentName : "Unknown Canticle")
            );
            break;
            
          default:
            // Fallback for any unexpected state
            console.error("Unknown previous level:", previous.level);
            renderCanticles(bookData.children);
        }
      });
    
    if (navigationHistory.length !== 0) {
      backButton.transition().duration(300).style("opacity", 1);
    }

    isNavigating = false;
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
    if (currentLevel === "canticles") return;
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
    .attr("font-family", "'IM Fell English SC', serif")
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
    .attr("font-family", "'IM Fell English SC', serif")
    .style("font-size", "20px")
    .text("−");
  
  document.getElementById("chart-container").appendChild(svg.node());

}