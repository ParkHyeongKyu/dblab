if (!Array.prototype.back){
    Array.prototype.back = function(){
        if(this.length == 0) return undefined;
        return this[this.length - 1];
    };
};
if (!Array.prototype.front){
    Array.prototype.front = function(){
        if(this.length == 0) return undefined;
        return this[0];
    };
};
function deepCopy(object) {
    if (object === null || typeof object !== "object") {
      return object;
    }
    // 객체인지 배열인지 판단
    const copy = Array.isArray(object) ? [] : {};
   
    for (let key of Object.keys(object)) {
      copy[key] = deepCopy(object[key]);
    }
   
    return copy;
  }
function deleteChart(id)
{
    const base = document.getElementById(id).querySelector('svg') || document.getElementById(id).querySelector('#ActionTable');
    if(base) base.remove();
}

function DrawDangerLineChart(data, id, color,w,h,start, end,Title="", MaterialName="", showList = false, goBackCallback = undefined)
{
    deleteChart(id);

    const axis_s = new Date(start.getFullYear(), start.getMonth(), start.getDate()-1, start.getHours());
    const axis_e = new Date(end.getFullYear(), end.getMonth(), end.getDate()+1,end.getHours());

    data = data.filter((v)=>{const now = new Date(v.date); return start <= now && now <= end;});

    //console.log(ChartData);
    // set the dimensions and margins of the graph
    const margin = {top: 30, right: 60, bottom: 90, left: 60, title: 20},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const base = d3.select('#'+id).append("svg")
    .attr("width", w)
    .attr("height", h)

    if(!data || data.length == 0)
    {
        base.append('rect')
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000')
        base.append('text')
            .attr("x", margin.left+width/2)
            .attr("y", margin.top+height/2)
            .attr("text-anchor", 'middle')
            .text("No Data Were Found");
        return;
    }

    const tooltip = d3.select('#'+id).select('.Tooltip');
    tooltip.style("background-color", color).style("transition","all").style("transition-duration","200ms");
    //const tooltipContent = tooltip.append('div');
    //console.log(tooltipContent);

    const title=base.append("text")
        .text(Title)
        .attr("transform", `translate(${margin.left + width/2},${margin.top})`)
        .attr("text-anchor", "middle")
        .attr("font-size", `${margin.title}px`);
    
    if(goBackCallback)
    {
        const wd = 80, he = 25;
        base.append("rect")
            .attr("x", margin.left + width - wd)
            .attr('y', margin.top - he)
            .attr('width', wd)
            .attr('height', he)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000').style('cursor', 'pointer')
            .on('click', (e)=>{
                goBackCallback(id);
            })
        base.append("text").style('cursor', 'pointer')
            .attr("transform", `translate(${margin.left + width - wd/2},${margin.top-8})`)
            .text('Go Back')
            .attr("font-size", `${15}px`)
            .attr('text-anchor', 'middle')
            .on('click', (e)=>{
                goBackCallback(id);
            })
    }

    const svg = base.append("g")
        .attr("transform", `translate(${margin.left},${margin.top+margin.title})`);

/*     // X axis
    const x = d3.scaleTime()
    .domain(d3.extent(ChartData, function(d) { 
        return new Date(d.date); 
    }))
    .range([ 0, width ]); */

    const x = d3.scaleTime()
    .domain([axis_s, axis_e])
    .range([ 0, width ]);

    //console.log("sdjfksjd", x(new Date("1970-02-10")))
    data.sort((a,b)=>{a = new Date(a.date); b = new Date(b.date); return (a>b)-(a<b)});
    var tickVal = data.reduce((acc, val)=>{
        if(acc.back() == undefined)
        {
            acc.push(new Date(val.date));
            return acc;
        }

        var bef = acc.back();
        var now = new Date(val.date);
        if(bef.getFullYear() != now.getFullYear()
            || bef.getMonth() != now.getMonth()) acc.push(now);
        else if(bef.getDate()+5 <= now.getDate()) acc.push(now);
        return acc;
    }, [])

    const isSameDate = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear()
           && date1.getMonth() === date2.getMonth()
           && date1.getDate() === date2.getDate();
    }
    const back = new Date(data.back().date);
    if(tickVal.findIndex((v)=>isSameDate(v,back)) == -1) tickVal.push(back);
    if(tickVal.findIndex((v)=>isSameDate(v,end)) == -1) tickVal.push(end);
    if(tickVal.findIndex((v)=>isSameDate(v, start)) == -1) tickVal.push(start);

    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x)
        //.tickFormat(d3.timeFormat("'%y-%m-%d"))
        .tickFormat(d3.utcFormat("'%y-%m-%d"))
        //.tickArguments([d3.timeDay.every(5)])
        .tickValues(tickVal)
    )
    .selectAll("text")
    .attr("transform", "translate(-5,0) rotate(-35)")
    .style("text-anchor", "end");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height+50)
        .text("날짜(date)").attr("font-size", `15px`);

    // Add Y axis
    const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

    svg.append("g")
    .call(d3.axisLeft(y));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height/2)
        .text("위험도(%)").attr("font-size", `15px`);

    const assistline = svg.append("g");

    assistline.append('line')
        .style("stroke", "grey")
        .style("stroke-width", 1)
        //.style("stroke-dasharray", ("1, 5"))
        .attr("stroke-width", 3)
        .attr("x1", x(axis_s))
        .attr("y1", y(30))
        .attr("x2", x(axis_e))
        .attr("y2", y(30))
    assistline.append('line')
        .style("stroke", "red")
        .style("stroke-width", 1)
        //.style("stroke-dasharray", ("1, 5"))
        .attr("stroke-width", 3)
        .attr("x1", x(axis_s))
        .attr("y1", y(80))
        .attr("x2", x(axis_e))
        .attr("y2", y(80))


    function draw(ChartData, color)
    {
        const g = svg.append("g")
            //.attr("transform", `translate(18.5)`);
        g.append("path")
            //.attr("transform", `translate(${margin.left},${margin.top})`)
            .datum(ChartData)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(function(d) { return x(new Date(d.date)) })
                .y(function(d) { return y(d.danger) })
                //.curve(d3.curveMonotoneX)
                ).style('opacity', 0.8)
        ChartData.map((d)=>{
            const c = g.append("circle")
            .style("fill", color)
            .attr("r", 5)
            .attr("cx", x(new Date(d.date)))
            .attr("cy", y(d.danger));

            g.append("circle")
            .style("fill", "#ffffff00")
            .attr("r", 20)
            .attr("cx", x(new Date(d.date)))
            .attr("cy", y(d.danger))
            .on('mouseover', (e)=>{
                c.attr("r", 6)
                tooltip.style('opacity', 1).text(d.danger.toFixed(2) + '%').style('display', 'block');
                if(showList)
                {
                    tooltip.append("hr");
                    const content = tooltip.append("div");
                    d.data.map((v)=>{
                        content.append("div").text(`${v.name} : ${v.danger.toFixed(2)}%`);
                    })
                }
            })
            .on('mouseout', (e)=>{
                c.attr("r", 5)
                tooltip.select('hr').remove();
                tooltip.select('div').remove();
                tooltip.style('opacity', 0).style('display', 'none')
            })
            .on('mousemove', (e)=>{
                //console.log(e)
                tooltip.style('left', (e.pageX+10)+'px').style('top', (e.pageY+10)+'px')
            })
        })
        ChartData.map((d)=>{
            g.append("line")
                //.attr("transform", `translate(${margin.left},${margin.top})`)
                .style("fill", "none")
                .style("stroke", color)
                .style("stroke-width", 1)
                .style("stroke-dasharray", ("1, 5"))
                .attr("x1", x(new Date(d.date)))
                .attr("y1", y(d.danger))
                .attr("x2", x(new Date(d.date)))
                .attr("y2", height)
        })

    }
    //draw(data, d3.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255, 0.5));
    draw(data, color)
    svg.append("text").text(MaterialName).attr("x", width).attr("text-anchor", "end");
    /* mi_code.map((m)=>{
        const ChartData = data.filter((v)=>v.mi_code == m);
        draw(ChartData, d3.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255, 0.5));
    }) */
}

function DrawDangerBarChart(data, id, color,w,h,now,Title="", onClickCallback)
{
    deleteChart(id);
    
    const base = d3.select('#'+id)
    .append("svg")
    .attr("width", w)
    .attr("height", h)

    const margin = {top: 30, right: 60, bottom: 90, left: 60, title: 20},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

    if(!data || data.length == 0)
    {
        base.append('rect')
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000')
        base.append('text')
            .attr("x", margin.left+width/2)
            .attr("y", margin.top+height/2)
            .attr("text-anchor", 'middle')
            .text("No Data Were Found")
        return;
    }


    const tooltip = d3.select('#'+id).select('.Tooltip');
    tooltip.style("background-color", color).style("transition","none");

    const title=base.append("text")
        .text(Title)
        .attr("transform", `translate(${margin.left + width/2},${margin.top})`)
        .attr("text-anchor", "middle")
        .attr("font-size", `${margin.title}px`);

    const svg = base.append("g")
        .attr("transform", `translate(${margin.left},${margin.top+margin.title})`);


    const x = d3.scaleBand()
        .domain(data.map((v)=>v.name))
        .range([ 0, width ])
        .paddingInner(0.24)
        .paddingOuter(0.1);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height+50)
        .text("화학 물질").attr("font-size", `15px`);

    const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

    svg.append("g")
    .call(d3.axisLeft(y));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height/2)
        .text("위험도(%)").attr("font-size", `15px`);

    const assistline = svg.append("g");

    assistline.append('line')
        .style("stroke", "grey")
        .style("stroke-width", 1)
        //.style("stroke-dasharray", ("1, 5"))
        .attr("stroke-width", 3)
        .attr("x1", 0)
        .attr("y1", y(30))
        .attr("x2", width)
        .attr("y2", y(30))
    assistline.append('line')
        .style("stroke", "red")
        .style("stroke-width", 1)
        //.style("stroke-dasharray", ("1, 5"))
        .attr("stroke-width", 3)
        .attr("x1", 0)
        .attr("y1", y(80))
        .attr("x2", width)
        .attr("y2", y(80))


    function draw(ChartData, color)
    {
        const g = svg.append("g")

        ChartData.map((d)=>{
            //console.log(d)
            g.append("rect")
            .style("fill", color).style('cursor', 'pointer').style('opacity', 0.8)
            .attr("r", 5)
            .attr("x", x(d.name))
            .attr("y", y(d.danger))
            .attr("width", x.bandwidth())
            .attr("height", height-y(d.danger)-1)
            .on('mouseover', (e)=>{
                tooltip.style('opacity', 1).text(`${d.name} : ${d.danger.toFixed(2)}%`)
                .style('display', 'block');
            })
            .on('mouseout', (e)=>{
                tooltip.style('opacity', 0)
                .style('display', 'none')
            })
            .on('mousemove', (e)=>{
                //console.log(e)
                tooltip.style('left', (e.pageX+10)+'px').style('top', (e.pageY+10)+'px')
            })
            .on('click', (e)=>{
                tooltip.style('opacity', 0).style('display', 'none')
                onClickCallback(id, d.mi_code);
            })
        })

    }

    draw(data, color)
    svg.append("text").text(now.toLocaleDateString("ko-KR")).attr("x", width).attr("text-anchor", "end");
}

function DrawInoutBarChart(data, id, color,w,h,now,Title="", onClickCallback)
{
    deleteChart(id);
    const margin = {top: 30, right: 60, bottom: 90, left: 60, title: 20},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

    const base = d3.select('#'+id)
    .append("svg")
    .attr("width", w)
    .attr("height", h)

    if(!data || data.length == 0)
    {
        base.append('rect')
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000')
        base.append('text')
            .attr("x", margin.left+width/2)
            .attr("y", margin.top+height/2)
            .attr("text-anchor", 'middle')
            .text("No Data Were Found");
        return;
    }

    const tooltip = d3.select('#'+id).select('.Tooltip');
    tooltip.style("background-color", color).style("transition","none");

    const title=base.append("text")
        .text(Title)
        .attr("transform", `translate(${margin.left + width/2},${margin.top})`)
        .attr("text-anchor", "middle")
        .attr("font-size", `${margin.title}px`);

    const svg = base.append("g")
        .attr("transform", `translate(${margin.left},${margin.top+margin.title})`);
        

    const x = d3.scaleBand(data.map(v=>v.name))
        .domain(data.map((v)=>v.name))
        .range([ 0, width ])
        .paddingInner(0.24)
        .paddingOuter(0.1);
    
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        //.attr("transform", "translate(-5,0) rotate(-35)")
        .style("text-anchor", "middle");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height+50)
        .text("화학 물질").attr("font-size", `15px`);

    const maxInout = data.reduce((acc, v)=>Math.max(acc, v.in, v.out), 0);
    //console.log(maxInout, [Math.trunc((-maxInout-25)/20)*20, Math.trunc((maxInout+25)/20)*20])
    
    const y = d3.scaleLinear()
        .domain([Math.trunc((-maxInout-25)/20)*20, Math.trunc((maxInout+25)/20)*20])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height/2)
        .text("입출고량(kg)").attr("font-size", `15px`);

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height*(1/5))
        .text("입고").attr("font-size", `15px`);
        
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height*(4/5))
        .text("출고").attr("font-size", `15px`);
    
    const MiddleLine = svg.append("g");

    MiddleLine.append('line')
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("stroke-width", 3)
        .attr("x1", 0)
        .attr("y1", y(0))
        .attr("x2", width)
        .attr("y2", y(0))
    function draw(ChartData, color)
    {
        const g = svg.append("g")

        ChartData.map((d)=>{
            //console.log(d)
            g.append("rect")
                .style("fill", "#3944BC").style('cursor', 'pointer').style('opacity', 0.8).style('stroke', '#000000')
                .attr("x", x(d.name))
                .attr("y", y(d.in))
                .attr("width", x.bandwidth())
                .attr("height", height/2-y(d.in))
                .on('mouseover', (e)=>{
                    tooltip.style('opacity', 1).text(`${d.name} : ${d.in}kg`).style("background-color", "#3944BC")
                    .style('display', 'block');
                })
                .on('mouseout', (e)=>{
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                })
                .on('mousemove', (e)=>{
                    //console.log(e)
                    tooltip.style('left', (e.pageX+10)+'px').style('top', (e.pageY+10)+'px')
                })
                .on('click', (e)=>{
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                    onClickCallback(id, d.mi_code);
                })

            g.append("rect")
                .style("fill", "#990F02").style('cursor', 'pointer').style('opacity', 0.8).style('stroke', '#000000')
                .attr("x", x(d.name))
                .attr("y", height/2)
                .attr("width", x.bandwidth())
                .attr("height", height/2-y(d.out))
                .on('mouseover', (e)=>{
                    tooltip.style('opacity', 1).text(`${d.name} : -${d.out}kg`).style("background-color", "#990F02")
                    .style('display', 'block');
                })
                .on('mouseout', (e)=>{
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                })
                .on('mousemove', (e)=>{
                    //console.log(e)
                    tooltip.style('left', (e.pageX+10)+'px').style('top', (e.pageY+10)+'px')
                })
                .on('click', (e)=>{
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                    onClickCallback(id, d.mi_code);
                })
        })
    }
    draw(data, color);

}

function DrawInoutLineChart(data, id, color,w,h,start, end,Title="", MaterialName="", goBackCallback)
{
    deleteChart(id);

    const base = d3.select('#'+id)
        .append("svg")
        .attr("width", w)
        .attr("height", h)

    const margin = {top: 30, right: 60, bottom: 90, left: 60, title: 20},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

    data = data.filter((v)=>{const now = new Date(v.date); return start <= now && now <= end;});

    if(!data || data.length == 0)
    {
        base.append('rect')
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000')
        base.append('text')
            .attr("x", margin.left+width/2)
            .attr("y", margin.top+height/2)
            .attr("text-anchor", 'middle')
            .text("No Data Were Found");
        return;
    }
    
    const axis_s = new Date(start.getFullYear(), start.getMonth(), start.getDate()-1, start.getHours());
    const axis_e = new Date(end.getFullYear(), end.getMonth(), end.getDate()+1,end.getHours());


    if(goBackCallback)
    {
        const wd = 80, he = 25;
        base.append("rect")
            .attr("x", margin.left + width - wd)
            .attr('y', margin.top - he)
            .attr('width', wd)
            .attr('height', he)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000').style('cursor', 'pointer')
            .on('click', (e)=>{
                goBackCallback(id);
            })
        base.append("text").style('cursor', 'pointer')
            .attr("transform", `translate(${margin.left + width - wd/2},${margin.top-8})`)
            .text('Go Back')
            .attr("font-size", `${15}px`)
            .attr('text-anchor', 'middle')
            .on('click', (e)=>{
                goBackCallback(id);
            })
    }

    const tooltip = d3.select('#'+id).select('.Tooltip');
    tooltip.style("background-color", color).style("transition","none");

    const title=base.append("text")
        .text(Title)
        .attr("transform", `translate(${margin.left + width/2},${margin.top})`)
        .attr("text-anchor", "middle")
        .attr("font-size", `${margin.title}px`);

    const svg = base.append("g")
        .attr("transform", `translate(${margin.left},${margin.top+margin.title})`);
        
    
    const x = d3.scaleTime()
        .domain([axis_s, axis_e])
        .range([ 0, width ]);

    //console.log("sdjfksjd", x(new Date("1970-02-10")))
    data.sort((a,b)=>{a = new Date(a.date); b = new Date(b.date); return (a>b)-(a<b)});
    var tickVal = data.reduce((acc, val)=>{
        if(acc.back() == undefined)
        {
            acc.push(new Date(val.date));
            return acc;
        }

        var bef = acc.back();
        var now = new Date(val.date);
        if(bef.getFullYear() != now.getFullYear()
            || bef.getMonth() != now.getMonth()) acc.push(now);
        else if(bef.getDate()+5 <= now.getDate()) acc.push(now);
        return acc;
    }, [])

    const isSameDate = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear()
            && date1.getMonth() === date2.getMonth()
            && date1.getDate() === date2.getDate();
    }
    const back = new Date(data.back().date);
    if(tickVal.findIndex((v)=>isSameDate(v,back)) == -1) tickVal.push(back);
    if(tickVal.findIndex((v)=>isSameDate(v,end)) == -1) tickVal.push(end);
    if(tickVal.findIndex((v)=>isSameDate(v, start)) == -1) tickVal.push(start);

    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x)
        //.tickFormat(d3.timeFormat("'%y-%m-%d"))
        .tickFormat(d3.utcFormat("'%y-%m-%d"))
        //.tickArguments([d3.timeDay.every(5)])
        .tickValues(tickVal)
    )
    .selectAll("text")
    .attr("transform", "translate(-5,0) rotate(-35)")
    .style("text-anchor", "end");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height+50)
        .text("날짜(date)").attr("font-size", `15px`);

    const maxInout = data.reduce((acc, v)=>Math.max(acc, v.in, v.out), 0);
    //console.log(maxInout, [Math.trunc((-maxInout-25)/20)*20, Math.trunc((maxInout+25)/20)*20])
    
    const y = d3.scaleLinear()
        .domain([Math.trunc((-maxInout-25)/20)*20, Math.trunc((maxInout+25)/20)*20])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height/2)
        .text("입출고량(kg)").attr("font-size", `15px`);

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height*(1/5))
        .text("입고").attr("font-size", `15px`);
        
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height*(4/5))
        .text("출고").attr("font-size", `15px`);
    
    const MiddleLine = svg.append("g");

    MiddleLine.append('line')
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("stroke-width", 3)
        .attr("x1", 0)
        .attr("y1", y(0))
        .attr("x2", width)
        .attr("y2", y(0))

    function draw(ChartData, color)
    {
        const bandwidth = width / ((axis_e.getTime() - axis_s.getTime()) / (1000 * 3600 * 24));
        const g = svg.append("g")

        g.append("path")
            //.attr("transform", `translate(${margin.left},${margin.top})`)
            .datum(ChartData)
            .attr("fill", "none")
            .attr("stroke", "#3944BC33")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(d=> x(new Date(d.date)))
                .y(d=> y(d.in))
                //.curve(d3.curveMonotoneX)
                )
            
        g.append("path")
            //.attr("transform", `translate(${margin.left},${margin.top})`)
            .datum(ChartData)
            .attr("fill", "none")
            .attr("stroke", "#990F0233")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(d=> x(new Date(d.date)))
                .y(d=> height - y(d.out))
                //.curve(d3.curveMonotoneX)
                )
        ChartData.map((d)=>{
            //console.log(d)
            const inBar = g.append("rect")
                .style("fill", "#3944BC").style('opacity', 0.8)
                .attr("x", x(new Date(d.date))-bandwidth/2)
                .attr("y", y(d.in))
                .attr("width", bandwidth)
                .attr("height", height/2-y(d.in))
                .style('stroke', '#000000')
                .on('mouseover', (e)=>{
                    inBar.attr("x", x(new Date(d.date))-1-bandwidth/2)
                        .attr("y", y(d.in)-1)
                        .attr("width", bandwidth+2)
                        .attr("height", height/2-y(d.in)+1)
                    tooltip.style('opacity', 1).style("background-color", "#3944BC").text(
                        `${d.date} : in(${d.in}kg), out(${d.out}kg)`
                    )
                    .style('display', 'block');
                })
                .on('mouseout', (e)=>{
                    inBar.attr("x", x(new Date(d.date))-bandwidth/2)
                        .attr("y", y(d.in))
                        .attr("width", bandwidth)
                        .attr("height", height/2-y(d.in))
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                })
                .on('mousemove', (e)=>{
                    //console.log(e)
                    tooltip.style('left', (e.pageX+10)+'px').style('top', (e.pageY+10)+'px')
                })
                .on('click', (e)=>{
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                })

            const outBar = g.append("rect")
                .style("fill", "#990F02").style('opacity', 0.8)
                .attr("x", x(new Date(d.date))-bandwidth/2)
                .attr("y", height/2)
                .attr("width", bandwidth)
                .attr("height", height/2-y(d.out))
                .style('stroke', '#000000')
                .on('mouseover', (e)=>{
                    outBar.attr("x", x(new Date(d.date))-1-bandwidth/2)
                        .attr("y", height/2)
                        .attr("width", bandwidth+2)
                        .attr("height", height/2-y(d.out)+1)
                    tooltip.style('opacity', 1).style("background-color", "#990F02").text(
                        `${d.date} : in(${d.in}kg), out(${d.out}kg)`
                    )
                    .style('display', 'block');
                })
                .on('mouseout', (e)=>{
                    outBar.attr("x", x(new Date(d.date))-bandwidth/2)
                        .attr("y", height/2)
                        .attr("width", bandwidth)
                        .attr("height", height/2-y(d.out))
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                })
                .on('mousemove', (e)=>{
                    //console.log(e)
                    tooltip.style('left', (e.pageX+10)+'px').style('top', (e.pageY+10)+'px')
                })
                .on('click', (e)=>{
                    tooltip.style('opacity', 0)
                    .style('display', 'none')
                })
        })
    }
    draw(data, color);
    svg.append("text").text(MaterialName).attr("x", width).attr("text-anchor", "end");
}

function DrawActionTable(data, id, w, h, now, Title="")
{
    deleteChart(id);

    if(!data || data.length == 0)
    {
        const base = d3.select('#'+id)
        .append("svg")
        .attr("width", w)
        .attr("height", h)

        const margin = {top: 30, right: 60, bottom: 90, left: 60, title: 20},
        width = w - margin.left - margin.right,
        height = h - margin.top - margin.bottom;

        base.append('rect')
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', '#ffffff')
            .attr('rx', '5')
            .style('stroke', '#000000')
        base.append('text')
            .attr("x", margin.left+width/2)
            .attr("y", margin.top+height/2)
            .attr("text-anchor", 'middle')
            .text("No Data Were Found");
        return;
    }

    const basediv = d3.select('#'+id).append("div").attr("id", "ActionTable")
    .style("width", w+'px')
    .style("height", h+'px').style('overflow-y', 'scroll')

    basediv.append('div').style('display', 'flex').style('justify-content', 'center').append('div').text(Title).style('font-size', '20px').style('margin-bottom', '10px');
    const base = basediv
    .append("table")
    .style("width",'100%')

    base.style("border-collapse", "collapse")
    .style("border", "2px grey solid");

    //base.append('caption').text(Title).style('font-size', '20px').style('position', 'fixed');
    
    //base.append('tr').append('td').attr('colspan', 3).text('bad').style('text-align', 'center');
    const header = base.append('tr')
    .style("border", "1px black solid").style("background-color", "lightgray");
        header.append('th').text('물질명');
        header.append('th').text('행동');
        header.append('th').text('가능한 위험도 변화량');
    
    data.toSorted((a,b)=>Math.abs(b.res)-Math.abs(a.res)).map((v)=>{
        const row = base.append('tr')
        .style("border", "1px black solid");
        row.append('td').text(v.name).style('text-align', 'center');
        row.append('td').text(v.action).style('text-align', 'center');
        row.append('td').text(v.res + '%p').style('text-align', 'center');
    })
}