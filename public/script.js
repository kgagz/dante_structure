// Sample hierarchical data structure
const bookData = {
  name: "Series",
  children: [
    {
      name: "Book 1",
      wordCount: 95000,
      children: [
        {
          name: "Chapter 1",
          wordCount: 5500,
          children: Array.from({ length: 12 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 2",
          wordCount: 7200,
          children: Array.from({ length: 18 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 3",
          wordCount: 6800,
          children: Array.from({ length: 15 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        }
      ]
    },
    {
      name: "Book 2",
      wordCount: 82000,
      children: [
        {
          name: "Chapter 1",
          wordCount: 4800,
          children: Array.from({ length: 10 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 2",
          wordCount: 5100,
          children: Array.from({ length: 12 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 3",
          wordCount: 6200,
          children: Array.from({ length: 14 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 4",
          wordCount: 5400,
          children: Array.from({ length: 13 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        }
      ]
    },
    {
      name: "Book 3",
      wordCount: 110000,
      children: [
        {
          name: "Chapter 1",
          wordCount: 7200,
          children: Array.from({ length: 16 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 2",
          wordCount: 8500,
          children: Array.from({ length: 20 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 3",
          wordCount: 6300,
          children: Array.from({ length: 14 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 4",
          wordCount: 7100,
          children: Array.from({ length: 15 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        },
        {
          name: "Chapter 5",
          wordCount: 7800,
          children: Array.from({ length: 18 }, (_, i) => ({ 
            name: `Page ${i+1}`, 
            wordCount: Math.floor(Math.random() * 300) + 400 
          }))
        }
      ]
    }
  ]
};

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
let currentLevel = "books";
let currentParent = null;
let navigationHistory = [];

// Initialize with book-level view
renderBooks(bookData.children);

// Function to render books view
function renderBooks(books) {
  currentLevel = "books";
  updateTitle("Book Series Word Counts");
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Remove any existing bars
  svg.selectAll(".bar-group").remove();
  
  // Create scales
  const x = d3.scaleBand()
    .domain(books.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(books, d => d.wordCount)])
    .nice()
    .range([height - margin.bottom, margin.top]);
  
  // Add axes
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
      .text("Word Count"));
  
  // Remove previous axes
  svg.selectAll(".x-axis").remove();
  svg.selectAll(".y-axis").remove();
  
  // Add new axes
  svg.append("g")
    .attr("class", "x-axis")
    .call(xAxis);
  
  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);
  
  // Create bar groups
  const barGroups = svg.append("g")
    .attr("class", "bar-group")
    .selectAll("g")
    .data(books)
    .join("g")
    .attr("cursor", "pointer")
    .on("click", (event, d) => {
      currentParent = d;
      navigationHistory.push({ level: "books", parent: null });
      renderChapters(d.children, d.name);
    });
  
  // Add bars
  barGroups.append("rect")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.wordCount))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.wordCount))
    .attr("fill", "#6495ED");
  
  // Add labels
  barGroups.append("text")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", d => y(d.wordCount) - 5)
    .attr("text-anchor", "middle")
    .text(d => d3.format(",")(d.wordCount))
    .style("font-size", "12px");
  
  // Hide back button
  backButton.transition().duration(300).style("opacity", 0);
}

// Function to render chapters view
function renderChapters(chapters, bookName) {
  currentLevel = "chapters";
  updateTitle(`Chapters in ${bookName}`);
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Remove any existing bars
  svg.selectAll(".bar-group").remove();
  
  // Create scales
  const x = d3.scaleBand()
    .domain(chapters.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(chapters, d => d.wordCount)])
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
      .text("Word Count"));
  
  // Remove previous axes
  svg.selectAll(".x-axis").remove();
  svg.selectAll(".y-axis").remove();
  
  // Add new axes
  svg.append("g")
    .attr("class", "x-axis")
    .call(xAxis);
  
  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);
  
  // Create bar groups with transition
  const barGroups = svg.append("g")
    .attr("class", "bar-group")
    .selectAll("g")
    .data(chapters)
    .join("g")
    .attr("cursor", "pointer")
    .on("click", (event, d) => {
      navigationHistory.push({ level: "chapters", parent: currentParent });
      currentParent = d;
      renderPages(d.children, d.name, bookName);
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
    .attr("y", d => y(d.wordCount))
    .attr("height", d => y(0) - y(d.wordCount));
  
  // Add labels
  barGroups.append("text")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", d => y(d.wordCount) - 5)
    .attr("text-anchor", "middle")
    .attr("opacity", 0)
    .text(d => d3.format(",")(d.wordCount))
    .style("font-size", "12px")
    .transition()
    .delay(300)
    .duration(400)
    .attr("opacity", 1);
  
  // Show back button
  backButton.transition().duration(300).style("opacity", 1);
}

// Function to render pages view
function renderPages(pages, chapterName, bookName) {
  currentLevel = "pages";
  updateTitle(`Pages in ${chapterName} (${bookName})`);
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Remove any existing bars
  svg.selectAll(".bar-group").remove();
  
  // Create scales
  const x = d3.scaleBand()
    .domain(pages.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(pages, d => d.wordCount)])
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
      .text("Word Count"));
  
  // Remove previous axes
  svg.selectAll(".x-axis").remove();
  svg.selectAll(".y-axis").remove();
  
  // Add new axes
  svg.append("g")
    .attr("class", "x-axis")
    .call(xAxis);
  
  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);
  
  // Create bar groups with transition
  const barGroups = svg.append("g")
    .attr("class", "bar-group")
    .selectAll("g")
    .data(pages)
    .join("g");
  
  // Add bars with transition
  barGroups.append("rect")
    .attr("x", d => x(d.name))
    .attr("y", height - margin.bottom)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", "#FD8D3C")
    .transition()
    .duration(750)
    .attr("y", d => y(d.wordCount))
    .attr("height", d => y(0) - y(d.wordCount));
  
  // Add labels
  barGroups.append("text")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", d => y(d.wordCount) - 5)
    .attr("text-anchor", "middle")
    .attr("opacity", 0)
    .text(d => d.wordCount)
    .style("font-size", "10px")
    .transition()
    .delay(300)
    .duration(400)
    .attr("opacity", 1);
  
  // Show back button
  backButton.transition().duration(300).style("opacity", 1);
}

// Function to handle back button clicks
function goBack() {
  if (navigationHistory.length === 0) return;
  
  const previous = navigationHistory.pop();
  
  if (previous.level === "books") {
    renderBooks(bookData.children);
  } else if (previous.level === "chapters") {
    currentParent = previous.parent;
    renderChapters(previous.parent.children, previous.parent.name);
  }
}

// Update chart title
function updateTitle(text) {
  title.text(text);
}

document.getElementById("chart-container").appendChild(svg.node());