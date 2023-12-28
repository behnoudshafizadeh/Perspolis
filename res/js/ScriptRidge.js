$('#SelectStateRigid').select2({});

$('#SelectYearRigid').select2({
    theme: "bootstrap-5",
    maximumSelectionLength: 10,
    closeOnSelect: false,
});

fetch("https://raw.githubusercontent.com/hamidlvn/DVV/main/project-folder/res/data/lineChart/state.json")
    .then(response => response.json())
    .then(data => {
        const citySelect = document.getElementById('SelectStateRigid');
        Object.entries(data).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            citySelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching data:', error));

const yearSelectRigid = document.getElementById('SelectYearRigid');
var year = new Date().getFullYear();
for (var i = 1895; i < year + 1; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearSelectRigid.appendChild(option);
};

function PlotRigidClicked() {
    stateValue = $("#SelectStateRigid").val();
    yearValues = $("#SelectYearRigid").val();

    createVisualizationRigid(stateValue, yearValues);

}

// Function to load CSV data
function loadTemperatureDataForRigid(filePath) {
    return d3.csv(filePath, function (data) {
        data.forEach(function (d) {
            d.Year = +d.Year;
            d.MinTemperature = +d.MinTemperature;
            d.MaxTemperature = +d.MaxTemperature;
        });
    });
}
function filterDataBySelectedYearsForRigid(data, state, selectedYears) {
    return data.filter(function (d) {
        return d.State === state &&
            selectedYears.includes(d.Year.toString());
    });
}
function createVisualizationRigid(selectedState, selectedYears) {
    const margin = { top: 80, right: 30, bottom: 50, left: 50 },
        width = 1000 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    d3.select("#ridgeLineContainer").select('svg').remove();
    // append the svg object to the body of the page
const svg = d3.select("#ridgeLineContainer")
    .append("svg")
    .attr("width", width + 100 + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("res/data/Ridge.csv").then(function (fullData) {
        // Convert string data to numbers
        data = filterDataBySelectedYearsForRigid(fullData, selectedState, selectedYears)
        data.forEach(function (d) {
            d.Year = +d.Year;
            d.MinTemperature = +d.MinTemperature;
            d.MaxTemperature = +d.MaxTemperature;
        });

        // Get the unique years from your data
        var years = Array.from(new Set(data.map(d => d.Year)));

        // Define the categories for minimum and maximum temperatures
        var categories = ["MinTemperature", "MaxTemperature"];

        // Create a color scale using a suitable color scheme for temperature
        var minTemperatureColors = {};
        var maxTemperatureColors = {};

        years.forEach(year => {
            var greenStart = d3.color("lightgreen");
            var greenEnd = d3.color("darkgreen");
            var orangeStart = d3.color("darkorange");
            var orangeEnd = d3.color("orange");
        
            var greenGradient = d3.scaleLinear().domain([0, 1]).range([greenStart, greenEnd]);
            var orangeGradient = d3.scaleLinear().domain([0, 1]).range([orangeStart, orangeEnd]);
        
            minTemperatureColors[year] = greenGradient(years.indexOf(year) / (years.length)).toString();
            maxTemperatureColors[year] = orangeGradient(years.indexOf(year) / (years.length)).toString();

        });
        function getColor(temperatureType, year) {
            if (temperatureType === "MinTemperature") {
                return minTemperatureColors[year];
            } else if (temperatureType === "MaxTemperature") {
                return maxTemperatureColors[year];
            }
        }
        var gap = 50
        for (var i = 0; i < years.length; i++) {
            gap = gap + 15
            svg.append("circle").attr("cx", width - gap).attr("cy", 0).attr("r", 6).style("fill", minTemperatureColors[years[i]])
            svg.append("circle").attr("cx", width - gap).attr("cy", 30).attr("r", 6).style("fill", maxTemperatureColors[years[i]])
        }

        svg.append("text").attr("x", width - gap).attr("y", -15).text("Min").style("font-size", "10px").attr("alignment-baseline", "left")
        svg.append("text").attr("x", width - gap).attr("y", 18).text("Max").style("font-size", "10px").attr("alignment-baseline", "left")

        function createArrayWithIntervals(maxNumber, interval) {
            const result = [];
            maxNumber = Math.ceil(maxNumber / interval) * interval;
            for (let i = 0; i <= maxNumber; i += interval) {
                result.push(i);
            }
            return result;
        }
        // Add X axis for temperature values
        maxRange = Math.ceil(d3.max(data).MaxTemperature / 10) * 10 + 10;
        var x = d3.scaleLinear()
            .domain([0, maxRange]) // Adjust the domain based on your data range
            .range([0, width - 200]);

        var xAxis = svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues(createArrayWithIntervals(maxRange, 10)));

        // Add X axis label
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width - 500)
            .attr("y", height + 40)
            .text("Temperature");
        // Compute kernel density estimation for each column (year and temperature type)
        function kernelDensityEstimator(kernel, X) {
            return function (V) {
                return X.map(function (x) {
                    return [x, d3.mean(V, function (v) { return kernel(x - v); })];
                });
            };
        }

        function kernelEpanechnikov(k) {
            return function (v) {
                return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
            };
        }
        // Compute kernel density estimation for each column (year and temperature type)
        var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40)); // Adjust ticks based on your data
        var allDensity = [];

        for (var i = 0; i < years.length; i++) {
            var year = years[i];
            for (var j = 0; j < categories.length; j++) {
                var key = categories[j];
                var density = kde(data.filter(d => d.Year === year).map(d => d[key]));
                allDensity.push({ key: key, year: year, density: density });
            }
        }

        // Create a Y scale for densities
        const y = d3.scaleLinear()
            .domain([0, 0.75])
            .range([height, 0]);

        // Create the Y axis for names
        const yName = d3.scaleBand()
            .domain(years)
            .range([0, height])
            .paddingInner(1)
        svg.append("g")
            .call(d3.axisLeft(yName).tickSize(0))
            .select(".domain").remove()

        // Add areas for Ridgeline plot
        var myCurves = svg.selectAll(".myCurves")
            .data(allDensity)
            .enter()
            .append("path")
            .attr("class", "myCurves")
            .attr("transform", function (d) {
                return "translate(0," + (yName(d.year) - height) + ")";
            })
            .attr("fill", function (d) {
                return getColor(d.key, d.year);
            })
            .datum(function (d) {
                return d.density;
            })
            .attr("opacity", 0.5)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.3)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(function (d) {
                    return x(d[0]);
                })
                .y(function (d) {
                    return y(d[1]);
                })
            );
    }).catch(function (error) {
        console.log("Error loading the data: " + error);
    });
};
