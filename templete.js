// Load the data and turn the Likes column into integers
const socialMedia = d3.csv("socialMedia.csv")

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    let width = 600, height = 400
    let margin = {top: 50, bottom: 50, left: 55, right: 50}

    // Create the SVG container
    let svg = d3.select('#boxplot')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .style('background', 'lightblue')

    // Set up scales for x and y axes
    let yScale = d3.scaleLinear()
                   .domain([d3.min(data, d => d.Likes), d3.max(data, d => d.Likes)])
                   .range([height-margin.bottom, margin.top])
    let xScale = d3.scaleBand()
                   .domain([...new Set(data.map(d => d.Platform))])
                   .range([margin.left, width-margin.right])

    // Add scales     
    let yAxis = svg.append("g")
                   .call(d3.axisLeft().scale(yScale))
                   .attr("transform", `translate(${margin.left}, 0)`) 
    let xAxis = svg.append("g")
                   .call(d3.axisBottom().scale(xScale))
                   .attr("transform", `translate(0, ${height-margin.bottom})`)

    // Add x-axis label
    svg.append("text")
       .text("Platform")
       .attr("x", width/2.2)
       .attr("y", height-10)
       .style("stroke", "black")

    // Add y-axis label
    svg.append("text")
       .text("Number of likes")
       .attr("x", 0-height/1.7)
       .attr("y", 15)
       .attr("transform", "rotate(-90)")
       .style("stroke", "black")

    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return {min, q1, median, q3, max};
    };

    // A constant called quantilesByGroups is created, which groups the data by the Platform column, and apply the
    // rollupFunction to each group. The result is a map that has keys of 4 unique platforms and values of
    // {min, q1, median, q3, max} for each platform.
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    // Iterates through the map (quantilesByGroups) created above and use D3 scales to determine the position and width
    // of each 4 box in the box plot, where x is the horizontal position of the box and boxwidth is how wide each box is.
    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        quantilesByGroups.forEach((quantiles, Platform) => {
          const x = xScale(Platform) + xScale.bandwidth() / 2;
          const min_y = yScale(quantiles.min);
          const max_y = yScale(quantiles.max);
          svg.append("line")
             .attr("x1", x)
             .attr("x2", x)
             .attr("y1", min_y)
             .attr("y2", max_y) 
             .attr("stroke", "black")
             .attr("stroke-width", 2);
        });

        // Draw box
        quantilesByGroups.forEach((quantiles, Platform) => {
          const x = xScale(Platform);
          const box_width = xScale.bandwidth();
          const q1_y = yScale(quantiles.q1);
          const q3_y = yScale(quantiles.q3);
          const box_height = q1_y - q3_y;
          svg.append("rect")
              .attr("x", x)  
              .attr("y", q3_y) 
              .attr("width", box_width) 
              .attr("height", box_height)
              .attr("fill", "steelblue") 
              .attr("stroke", "black") 
              .attr("stroke-width", 2);
        });
      
        // Draw median line
        quantilesByGroups.forEach((quantiles, Platform) => {
          const x = xScale(Platform); 
          const box_width = xScale.bandwidth(); 
          const median_y = yScale(quantiles.median); 
          svg.append("line")
             .attr("x1", x)  
             .attr("x2", x + box_width) 
             .attr("y1", median_y)
             .attr("y2", median_y) 
             .attr("stroke", "black") 
             .attr("stroke-width", 2);
        });
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("socialMedia.csv")

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });
    const avgLikesByGroup = d3.rollup(
        data, 
        v => d3.mean(v, d => d.Likes),
        d => d.Platform, 
        d => d.PostType 
    );
    const avgLikesArray = [];
    avgLikesByGroup.forEach((postTypes, platform) => {
        postTypes.forEach((avgLikes, postType) => {
            avgLikesArray.push({ Platform: platform, PostType: postType, AvgLikes: avgLikes });
        });
    });

    // Define the dimensions and margins for the SVG
    let width = 600, height = 400
    let margin = {top: 50, bottom: 50, left: 50, right: 50}

    // Create the SVG container
    let svg = d3.select('#barplot')
                .append('svg')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style('background', 'lightblue')
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

    const platforms = [...new Set(avgLikesArray.map(d => d.Platform))];
    const postTypes = [...new Set(avgLikesArray.map(d => d.PostType))];

    // Define four scales
    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .padding(0.2);
    const x1 = d3.scaleBand()
        .domain(postTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);
    const y = d3.scaleLinear()
        .domain([0, d3.max(avgLikesArray, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);
    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y     
    let x0_scale = svg.append("g")
       .attr("transform", `translate(0, ${height})`)
       .call(d3.axisBottom(x0)); 
    let y_scale = svg.append("g")
       .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
       .text("Platform")
       .attr("x", width/2.2)
       .attr("y", height + 38)
       .style("stroke", "black")

    // Add y-axis label
    svg.append("text")
       .text("Average number of likes")
       .attr("x", 0-height/1.7)
       .attr("y", -37)
       .attr("transform", "rotate(-90)")
       .style("stroke", "black")

    // Group container for bars
    const barGroups = svg.selectAll("bar")
      .data(avgLikesArray)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d.Platform)},0)`);

    // Draw bars
    barGroups.append("rect")
        .attr("x", d => x1(d.PostType)) 
        .attr("y", d => y(d.AvgLikes)) 
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes)) 
        .attr("fill", d => color(d.PostType)) 
        .attr("stroke", "black") 
        .attr("stroke-width", 1);

    // Add the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 20}, ${-20})`);
    const types = [...new Set(avgLikesArray.map(d => d.PostType))];
    types.forEach((type, i) => {
    
    // Add the small square for the legend
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(type));
    
    legend.append("text")
      .attr("x", 20) // Slightly to the right of the rectangle
      .attr("y", i * 20 + 12)
      .text(type)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "12px");
    });
});

// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 
d3.csv("socialMedia.csv").then(data => {
    data.forEach(d => {
        d.Date = new Date(d.Date);
        d.Likes = +d.Likes;
    });
    let groupedData = d3.group(data, d => d.Date.toDateString()); 
    let summaryData = Array.from(groupedData, ([date, values]) => {
        let avgLikes = d3.mean(values, d => d.Likes);
        let formattedDate = new Date(date);
        let formattedDateStr = `${formattedDate.getMonth() + 1}/${formattedDate.getDate()}/${formattedDate.getFullYear()} (${formattedDate.toLocaleDateString('en-US', { weekday: 'long' })})`;
        return { Date: formattedDateStr, AvgLikes: avgLikes.toFixed(3) };
    });
    let csvContent = "Date,AvgLikes\n" + 
    summaryData.map(d => `${d.Date},${d.AvgLikes}`).join("\n");
    let blob = new Blob([csvContent], { type: "text/csv" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "SocialMediaTime.csv";
    //link.click();
});

const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });
    let parseDate = d3.timeParse("%m/%d/%Y (%A)");
    let formatDate = d3.timeFormat("%m/%d");
    data.forEach(function(d) {
        d.Date = parseDate(d.Date.trim());
        d.AvgLikes = +d.AvgLikes;   
    });
    let filteredData = data.filter(d => d.Date >= parseDate("3/1/2024 (Friday)") 
                                    && d.Date <= parseDate("3/7/2024 (Thursday)"));

    // Define the dimensions and margins for the SVG
    let width = 600, height = 400
    let margin = {top: 50, bottom: 50, left: 50, right: 50}

    // Create the SVG container
    let svg = d3.select("#lineplot")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style("background", "lightblue")
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes  
    let x = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")  
        .attr("transform", `translate(0, ${height})`)  
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d")))  
        .selectAll("text")  
        .attr("transform", "rotate(-45)")  
        .style("text-anchor", "end");
    svg.append("g")  
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
       .text("Date")
       .attr("x", width / 2)
       .attr("y", height + margin.bottom - 10)
       .style("text-anchor", "middle");

    // Add y-axis label
    svg.append("text")
       .text("Average number of likes")
       .attr("transform", "rotate(-90)")
       .attr("x", -height / 2)
       .attr("y", -margin.left + 15)
       .style("text-anchor", "middle");

    // Draw the line and path. Remember to use curveNatural. 
    let line = d3.line()
    .x(d => x(d.Date))
    .y(d => y(d.AvgLikes))
    .curve(d3.curveNatural);

    svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Date))
        .attr("cy", d => y(d.AvgLikes))
        .attr("r", 4)
        .attr("fill", "red");

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .tickValues(filteredData.map(d => d.Date))
            .tickFormat(d3.timeFormat("%m/%d")))
        .selectAll("text")
        .attr("transform", "rotate(-25)")  
        .style("text-anchor", "end");
});
