// Initialize Select2 for state and year dropdowns
$('#SelectState').select2({});
$('#SelectYear').select2({
    theme: "bootstrap-5",
    maximumSelectionLength: 10,
    closeOnSelect: false,
});

// Fetch data for state dropdown from JSON file
fetch("https://raw.githubusercontent.com/hamidlvn/DVV/main/project-folder/res/data/lineChart/state.json")
    .then(response => response.json())
    .then(data => {
        const citySelect = document.getElementById('SelectState');
        Object.entries(data).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            citySelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching data:', error));

// Populate year dropdown with years from 1895 to the current year
const yearSelect = document.getElementById('SelectYear');
const currentYear = new Date().getFullYear();
for (let i = 1895; i <= currentYear; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
}

// Function triggered when "Plot Chart" button is clicked
function PlotLineClicked() {
    const stateValue = $("#SelectState").val();
    const yearValues = $("#SelectYear").val();
    createVisualization(stateValue, yearValues);
}

// Function to load temperature data from CSV file
function loadTemperatureData(filePath) {
    return d3.csv(filePath, function(d) {
        return {
            state: d.state,
            date: d3.timeParse("%Y-%m")(d.year),
            value: +d.value // Convert value to a number
        };
    });
}

// Function to filter data by state and selected years
function filterDataBySelectedYears(data, state, selectedYears) {
    return data.filter(function(d) {
        return d.state === state &&
            selectedYears.includes(d.date.getFullYear().toString());
    });
}

// Function for creating the temperature visualization
function createVisualization(selectedState, selectedYears) {
    const minT = "https://raw.githubusercontent.com/hamidlvn/DVV/main/project-folder/res/data/lineChart/minData.csv";
    const maxT = "https://raw.githubusercontent.com/hamidlvn/DVV/main/project-folder/res/data/lineChart/maxData.csv";
    const avgT = "https://raw.githubusercontent.com/hamidlvn/DVV/main/project-folder/res/data/lineChart/avgData.csv";

    // Load data for minimum, maximum, and average temperatures
    Promise.all([
        loadTemperatureData(minT),
        loadTemperatureData(maxT),
        loadTemperatureData(avgT)
    ]).then(function(data) {
        const minTempData = data[0];
        const maxTempData = data[1];
        const avgTempData = data[2];

        // Filter data by selected state and years
        const filteredMinTempData = filterDataBySelectedYears(minTempData, selectedState, selectedYears);
        const filteredMaxTempData = filterDataBySelectedYears(maxTempData, selectedState, selectedYears);
        const filteredAvgTempData = filterDataBySelectedYears(avgTempData, selectedState, selectedYears);

        // Merge filtered data for visualization
        const mergedData = filteredAvgTempData.map(function(d, i) {
            return {
                date: d.date,
                minTemp: filteredMinTempData[i].value,
                maxTemp: filteredMaxTempData[i].value,
                avgTemp: d.value
            };
        });

        // Visualization settings
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const width = 1000 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Remove existing SVG to prevent duplicates
        d3.select("#LineChartContainer").select("svg").remove();

        // Create new SVG
        const svg = d3.select("#LineChartContainer")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X-axis scale
        const xScale = d3.scaleTime()
            .domain(d3.extent(mergedData, function(d) { return d.date; }))
            .range([0, width - 200]);

        // X-axis
        const xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        // Y-axis scale
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(mergedData, function(d) { return Math.max(d.minTemp, d.maxTemp, d.avgTemp); })])
            .range([height, 0]);

        // Y-axis
        const yAxis = svg.append("g")
            .call(d3.axisLeft(yScale));

        // Y-axis label
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -margin.top)
            .text("Temperature");

        // Clip path for zooming
        const clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width - 200)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Brush for zooming
        const brush = d3.brushX()
            .extent([[0, 0], [width - 200, height]])
            .on("end", updateChart);

        // Line for minimum temperature
        const lineMin = svg.append('g')
            .attr("clip-path", "url(#clip)");

        // Line for maximum temperature
        const lineMax = svg.append('g')
            .attr("clip-path", "url(#clip)");

        // Append path for minimum temperature
        lineMin.append("path")
            .datum(mergedData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#0565f9")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return xScale(d.date); })
                .y(function(d) { return yScale(d.minTemp); })
            );

        // Append path for maximum temperature
        lineMax
            .append("g")
            .attr("class", "brush")
            .call(brush);

        lineMax.append("path")
            .datum(mergedData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#FA8128")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return xScale(d.date); })
                .y(function(d) { return yScale(d.maxTemp); })
            );

        lineMax
            .append("g")
            .attr("class", "brush")
            .call(brush);

        // Scatter plot for average temperature
        svg.selectAll("dot")
            .data(mergedData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.avgTemp))
            .attr("r", 3)
            .style("fill", "#bb99d2");

        // Append brush for scatter plot
        svg.selectAll("dot").append("g")
            .attr("class", "brush")
            .call(brush);

        // Add X and Y axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Legend for temperature types
        svg.append("circle").attr("cx", width - 110).attr("cy", 20).attr("r", 6).style("fill", "#FA8128");
        svg.append("text").attr("x", width - 95).attr("y", 20).text("Max Temperature").style("font-size", "15px").attr("alignment-baseline", "middle");
        svg.append("circle").attr("cx", width - 110).attr("cy", 50).attr("r", 6).style("fill", "#bb99d2");
        svg.append("text").attr("x", width - 95).attr("y", 50).text("Avg Temperature").style("font-size", "15px").attr("alignment-baseline", "middle");
        svg.append("circle").attr("cx", width - 110).attr("cy", 80).attr("r", 6).style("fill", "#0565f9");
        svg.append("text").attr("x", width - 95).attr("y", 80).text("Min Temperature").style("font-size", "15px").attr("alignment-baseline", "middle");

        // Function to handle zooming and updating chart
        function updateChart(event, d) {
            const extent = event.selection;

            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
            } else {
                xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])]);
                svg.selectAll(".brush").call(brush.move, null);
            }

            xAxis.transition().duration(1000).call(d3.axisBottom(xScale));

            lineMin
                .select('.line')
                .transition()
                .duration(1000)
                .attr("d", d3.line()
                    .x(function(d) { return xScale(d.date); })
                    .y(function(d) { return yScale(d.minTemp); })
                );

            lineMax
                .select('.line')
                .transition()
                .duration(1000)
                .attr("d", d3.line()
                    .x(function(d) { return xScale(d.date); })
                    .y(function(d) { return yScale(d.maxTemp); })
                );

            svg.selectAll(".dot")
                .transition()
                .duration(1000)
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d.avgTemp));
        }

        // Handle double click to reset zoom
        function idled() {
            idleTimeout = null;
        }

        svg.on("dblclick", function() {
            xScale.domain(d3.extent(mergedData, function(d) { return d.date; }));
            xAxis.transition().call(d3.axisBottom(xScale));

            lineMin
                .select('.line')
                .transition()
                .attr("d", d3.line()
                    .x(function(d) { return xScale(d.date); })
                    .y(function(d) { return yScale(d.minTemp); })
                );

            lineMax
                .select('.line')
                .transition()
                .attr("d", d3.line()
                    .x(function(d) { return xScale(d.date); })
                    .y(function(d) { return yScale(d.maxTemp); })
                );

            svg.selectAll(".dot")
                .transition()
                .duration(1000)
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(d.avgTemp));
        });
    });
}
