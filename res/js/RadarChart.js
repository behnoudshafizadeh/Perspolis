$( '#SelectStateRadar' ).select2( {
} );

$( '#SelectYearRadar' ).select2( {
    theme: "bootstrap-5",
    maximumSelectionLength: 10,
    closeOnSelect: false,
} );


fetch("https://raw.githubusercontent.com/hamidlvn/DVV/main/project-folder/res/data/lineChart/state.json")
      .then(response => response.json())
      .then(data => {
        const citySelect = document.getElementById('SelectStateRadar');
        Object.entries(data).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key; 
            option.textContent = value; 
            citySelect.appendChild(option);
            
        });
      })
      .catch(error => console.error('Error fetching data:', error));

const yearS = document.getElementById('SelectYearRadar');
var year = new Date().getFullYear() ;
for(var i=1895 ;i< year+1; i++){
    const option = document.createElement('option');
    option.value = i; 
    option.textContent = i; 
    yearS.appendChild(option);
    
};



function PlotRaderClicked () {

    stateValue = $("#SelectStateRadar").val();
    yearValues = $("#SelectYearRadar").val();

    if( yearValues.length == 0 || stateValue == null){
        return triggerAlert('liveAlertPlaceholder');
    }
    getData(stateValue, yearValues);

}

function alertMessage(message, type, PlaceHolderId) {
    var alertPlaceholder = document.getElementById(PlaceHolderId)
    var wrapper = document.createElement('div')
    wrapper.innerHTML = '<div class="alert alert-' + type + ' alert-dismissible d-flex align-items-center" role="alert"> <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>' + message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div></div>'
  
    alertPlaceholder.append(wrapper)
}

function getData(selectedState, selectedYears) {

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

        // Filter data by state and selected years
        const filteredMinTempData = filterDataBySelectedYears(minTempData, selectedState, selectedYears);
        const filteredMaxTempData = filterDataBySelectedYears(maxTempData, selectedState, selectedYears);
        const filteredAvgTempData = filterDataBySelectedYears(avgTempData, selectedState, selectedYears);

        // console.log(transformData(filteredMinTempData))
        dataMin = transformData(filteredMinTempData)
        dataAvg = transformData(filteredAvgTempData)
        dataMax = transformData(filteredMaxTempData)

        console.log(data)

        layoutMax = {
            title: "Maximum",
            polar: {
              radialaxis: {
                visible: true,
                range: [0, 100]
              }
            },
            // width: 600, // Set width to 800 pixels
            // height: 500
          }

          layoutMin = {
            title: "Minimum",
            polar: {
              radialaxis: {
                visible: true,
                range: [0, 100]
              }
            },
            // width: 600, // Set width to 800 pixels
            // height: 500
          }

          layoutMean = {
            title: "Mean",
            polar: {
              radialaxis: {
                visible: true,
                range: [0, 100]
              }
            },
            // width: 600, // Set width to 800 pixels
            // height: 500
          }

        console.log(data) 
          
        Plotly.newPlot("dataMin", dataMin, layoutMin)
        Plotly.newPlot("dataAvg", dataAvg, layoutMean)
        Plotly.newPlot("dataMax", dataMax, layoutMax)

      });

}

function transformData(data) {
    var groups = {};
    data.forEach(entry => {
      // Extract year from the date
      var year = entry.date.getFullYear().toString();

      if (!groups[year]) {
        groups[year] = { type: 'scatterpolar', theta: ['Jan','Feb','Mar', 'Apr', 'May', 'Jun', 'July', 'Aug','Sep', 'Oct', 'Nov', 'Dec'], r: [], name: 'Year: ' + year };
      }

    //   groups[year].theta.push(entry.date);
      groups[year].r.push(entry.value);
    });

    // Convert groups object to array
    var plotlyData = Object.values(groups);

    plotlyData.forEach(trace => {
        trace.hovertemplate = 'Month: %{theta}<br>Temp: %{r}<extra></extra>'; // Customize this line as needed
      });

    return plotlyData;
  }


// Function to load CSV data
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

