<?php
$server = "dg_db";
$username = "dg";
$password = "password";
$db = "dg";

$conn = new mysqli($server, $username, $password, $db);

if($conn->connect_error)
	die("Connection failed ".$conn->connect_error);
$conn->query('set names utf8');


$c_code = 7;

$query = "select * from view_chemicals where c_code=".$c_code.";";
$result = $conn->query($query);
$chemicals = [];
if($result->num_rows > 0)
{
	while($row = $result->fetch_assoc())
	{
		array_push($chemicals, [
			'mi_code'=>$row['mi_code'],
			'name'=>$row['name']		
		]);
	}
}
else $chemicals = ['message' => 'No results'];

$query = "select chem.c_code, dan.mi_code, dan.date, dan.danger from chemicalDangerByDate dan inner join view_chemicals as chem on chem.mi_code = dan.mi_code where chem.c_code = ".$c_code." order by dan.date;";
$result = $conn->query($query);
$dangerByDate = [];
if($result->num_rows > 0)
{
	while($row = $result->fetch_assoc())
	{
		array_push($dangerByDate, [
			'mi_code'=>$row['mi_code'],
			'date'=>$row['date'],
			'danger'=>floatval($row['danger'])
		]);
	}
}
else $dangerByDate = ['message' => 'No results'];

//$query = "select inout.mi_code, inout.date, inout.in_, inout.out_ from view_inoutRecord as inout inner join view_chemicals as chem on chem.mi_code = inout.mi_code where chem.c_code = ".$c_code." order by inout.date;";
$query = "select mi_code, date, in_, out_ from view_inoutRecord where c_code = ".$c_code.";";
$result = $conn->query($query);
$inoutRecord = [];
if($result->num_rows > 0)
{
	while($row = $result->fetch_assoc())
	{
		array_push($inoutRecord, [
			'mi_code'=>$row['mi_code'],
			'date'=>$row['date'],
			'in'=>$row['in_'],
			'out'=>$row['out_'],
		]);
	}
}
else $inoutRecord = ['message' => 'No results'];

//$query = "select inout.mi_code, inout.date, inout.in_, inout.out_ from view_inoutRecord as inout inner join view_chemicals as chem on chem.mi_code = inout.mi_code where chem.c_code = ".$c_code." order by inout.date;";
$query = "select dca.mi_code, dca.date, dca.action, dca.res from dangerChangeByAction dca inner join view_chemicals as chem on chem.mi_code = dca.mi_code where chem.c_code = ".$c_code." order by dca.date, mi_code;";
$result = $conn->query($query);
$dangerChangeByAction = [];
if($result->num_rows > 0)
{
	while($row = $result->fetch_assoc())
	{
		array_push($dangerChangeByAction, [
			'mi_code'=>$row['mi_code'],
			'date'=>$row['date'],
			'action'=>$row['action'],
			'res'=>floatval($row['res']),
		]);
	}
}
else $dangerChangeByAction = ['message' => 'No results'];

//print_r($rows);
?>

<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" href="index.css">
		<script defer src="https://cdn.jsdelivr.net/npm/d3@7"></script>
		<script defer src="chart.js"> </script>
	</head>
    <body>
		<div class="container">
			<div class="searchInput">
				<input type="text" placeholder="Search Chemicals...">
				<div class="resultBox"></div>
				<div class="icon">Go</div>
			</div>
		</div>
		<div class="ChartWrap">
			<div id="Chart1" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart2" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart3" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart4" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart5" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart6" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart7" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart8" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart9" class="Chart"> <div class="Tooltip"></div> </div>
			<div id="Chart10" class="Chart"> <div class="Tooltip"></div> </div>
		</div>
		<div class="Selection">
			<div class="middle">
				<div class="multi-range-slider">
					<!-- 진짜 슬라이더 -->
					<input type="range" id="input-left" min="0" max="100" value="0" />
					<input type="range" id="input-right" min="0" max="100" value="100" />

					<!-- 커스텀 슬라이더 -->
					<div class="slider">
					<div class="track"></div>
					<div class="range"></div>
					<div class="thumb left"></div>
					<div class="thumb right"></div>
					</div>
				</div>
			</div>
			
			<select name="today" id="today-sel">
			</select>
		</div>
		<script>
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
			const chemicals = <?=json_encode($chemicals) ?>;
			const danger = <?=json_encode($dangerByDate) ?>;
			const inoutRecord = <?=json_encode($inoutRecord) ?>;
			const dangerChangeByAction = <?=json_encode($dangerChangeByAction) ?>;

			console.log("Received: ", chemicals);
			console.log("Received: ", danger);
			console.log("Received: ", inoutRecord);
			console.log("Received: ", dangerChangeByAction);


			let suggestions =  chemicals.map((v)=>v.name).toSorted((a,b)=>(a>b)-(a<b));
			const searchWrapper = document.querySelector(".searchInput");
			const inputBox = searchWrapper.querySelector("input");
			const suggBox = searchWrapper.querySelector(".resultBox");
			const icon = searchWrapper.querySelector(".icon");
			let linkTag = searchWrapper.querySelector("a");
			let webLink;

			inputBox.onkeyup = (e)=>{
				let userData = e.target.value;
				let emptyArray = [];
				console.log(e.keyCode)
				if(e.keyCode == 13)
				{
					const mi_code = chemicals.find(v=>v.name==userData)?.mi_code;
					if(!mi_code) return;
					flag1 = flag2 = true;
					flag1_mi = flag2_mi = mi_code;
					Draw();
				}
				else if(userData){
					icon.onclick = ()=>{
						const mi_code = chemicals.find(v=>v.name==userData)?.mi_code;
						if(!mi_code) return;
						flag1 = flag2 = true;
						flag1_mi = flag2_mi = mi_code;
						Draw();
					}

					emptyArray = suggestions.filter((data)=>{
						return data.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase()); 
					});
					emptyArray = emptyArray.map((data)=>{
						return data = '<li>'+ data +'</li>';
					});
					searchWrapper.classList.add("active");
					showSuggestions(emptyArray);
					let allList = suggBox.querySelectorAll("li");
					for (let i = 0; i < allList.length; i++) {
						allList[i].setAttribute("onclick", "select(this)");
					}
				}else{	
					searchWrapper.classList.remove("active");
				}
			}

			function select(element,event){
				let selectData = element.textContent;
				inputBox.value = selectData;
				icon.onclick = ()=>{
					const mi_code = chemicals.find(v=>v.name==selectData)?.mi_code;
					if(!mi_code) return;
					flag1 = flag2 = true;
					flag1_mi = flag2_mi = mi_code;
					Draw();
				}
				searchWrapper.classList.remove("active");
			}

			function showSuggestions(list){
				let listData;
				if(!list.length){
					listData = suggestions.map((v)=>`<li>${v}</li>`).join('')
				}else{
					listData = list.join('');
				}
				suggBox.innerHTML = listData;
			}

			const inputLeft = document.getElementById("input-left");
			const inputRight = document.getElementById("input-right");

			const thumbLeft = document.querySelector(".slider > .thumb.left");
			const thumbRight = document.querySelector(".slider > .thumb.right");
			const range = document.querySelector(".slider > .range");

			const TodaySel = document.querySelector("#today-sel");

			const ableDates = [...new Set([...danger.reduce((acc, v)=>{acc.push(v.date); return acc;}, []), 
							               ...inoutRecord.reduce((acc, v)=>{acc.push(v.date); return acc;}, []),
										   ...dangerChangeByAction.reduce((acc, v)=>{acc.push(v.date); return acc;}, [])])
										].toSorted((a,b)=>{
											const aa = new Date(a);
											const bb = new Date(b);
											return (aa>bb)-(aa<bb);
										});

			//const sdate = new Date("1970-01-01"), edate = new Date("1970-02-28");
			const sdate = new Date(ableDates.front()), edate = new Date(ableDates.back());

			var start = sdate;
			var end = edate;
			var now = new Date("1970-02-15");


			const setLeftValue = () => {
				const _this = inputLeft;
				const [min, max] = [parseInt(_this.min), parseInt(_this.max)];
				
				_this.value = Math.min(parseInt(_this.value), parseInt(inputRight.value) - 1);
				
				const s = parseInt((sdate.valueOf() + (_this.value/100)*(edate.valueOf()-sdate.valueOf()))/86400000, 10)*86400000;
				start = new Date(s);
				Draw();

				const percent = ((_this.value - min) / (max - min)) * 100;
				thumbLeft.style.left = percent + "%";
				range.style.left = percent + "%";
			};

			const setRightValue = () => {
				const _this = inputRight;
				const [min, max] = [parseInt(_this.min), parseInt(_this.max)];
				
				_this.value = Math.max(parseInt(_this.value), parseInt(inputLeft.value) + 1);
				
				const e = parseInt((edate.valueOf() - ((100-_this.value)/100)*(edate.valueOf()-sdate.valueOf()))/86400000, 10)*86400000;
				end = new Date(e);
				Draw();

				const percent = ((_this.value - min) / (max - min)) * 100;
				thumbRight.style.right = 100 - percent + "%";
				range.style.right = 100 - percent + "%";
			};



			ableDates.map((v)=>{
				TodaySel.innerHTML += `<option value="${v}">${v}</option>`;
			});
			
			const setToday = () => {
				now = new Date(TodaySel.options[TodaySel.selectedIndex].value);
				Draw();
			}

			inputLeft.addEventListener("input", setLeftValue);
			inputRight.addEventListener("input", setRightValue);
			TodaySel.addEventListener("change", setToday);

			const WIDTH = 600, HEIGHT = 400;

			const averageDanger = danger.reduce((acc, v)=>{
				const idx = acc.findIndex((ac)=>ac.date === v.date);
				if(idx == -1)
				{
					acc.push({"date":v.date, "danger":v.danger, "num":1, "data":[{"name":chemicals.find((d)=>d.mi_code===v.mi_code).name, "mi_code":v.mi_code, "danger":parseFloat(v.danger)}]});
				}
				else
				{
					acc[idx].danger = ((acc[idx].num*acc[idx].danger)+v.danger)/(acc[idx].num+1);
					acc[idx].num++;
					acc[idx].data.push({"name":chemicals.find((d)=>d.mi_code===v.mi_code).name,"mi_code":v.mi_code, "danger":v.danger});
				}
				return acc;
			}, []).map((v)=>({"date":v.date, "danger":v.danger, "data":v.data.toSorted((a,b)=>b.danger-a.danger)}));

			const isSameDate = (date1, date2) => {
				return date1.getFullYear() === date2.getFullYear()
				&& date1.getMonth() === date2.getMonth()
				&& date1.getDate() === date2.getDate();
			}



			var flag1 = false, flag1_mi, flag2 = false, flag2_mi;
			function Draw()
			{
				const todayDanger = averageDanger.find((av)=>isSameDate(new Date(av.date), now))?.data;
				const todayInout = inoutRecord.filter((v)=>isSameDate(new Date(v.date), now))
											.reduce((acc, v)=>{
												acc.push({...v, "name":chemicals.find((chem)=>chem.mi_code == v.mi_code).name});
												return acc;
											},[]);
				const todayAction = dangerChangeByAction.filter((v)=>isSameDate(new Date(v.date), now))
											.reduce((acc, v)=>{
												acc.push({...v, "name":chemicals.find((chem)=>chem.mi_code == v.mi_code).name});
												return acc;
											},[]);
				function onGoBackDanger(id)
				{
					flag1 = false;
					DrawDangerBarChart(todayDanger,id,"#008c6d",WIDTH,HEIGHT,now,"("+now.toLocaleDateString("ko-KR") + ")의 위험도", onClickDangerBar);
				}
				function onClickDangerBar(id, mi_code)
				{
					flag1 = true; flag1_mi = mi_code;
					const ChartData = danger.filter((v)=>v.mi_code == mi_code);
					const name = chemicals.find(v=>v.mi_code == mi_code).name;
					DrawDangerLineChart(ChartData,id,"#008c00",WIDTH,HEIGHT,start, end, "날짜별 "+name+"의 위험도","<"+name+">", false, onGoBackDanger);
				}

				function onGoBackInout(id)
				{
					flag2 = false;
					DrawInoutBarChart(todayInout, id, "#004512", WIDTH, HEIGHT, now, "("+now.toLocaleDateString("ko-KR") + ")의 입출고량", onClickInoutBar);
				}
				function onClickInoutBar(id, mi_code)
				{
					flag2 = true; flag2_mi = mi_code;
					const ChartData = inoutRecord.filter((v)=>v.mi_code == mi_code);
					const name = chemicals.find(v=>v.mi_code == mi_code).name;
					DrawInoutLineChart(ChartData, id, "#004554", WIDTH, HEIGHT, start, end, "날짜별 "+name+"의 입출고량", "<"+name+">", onGoBackInout);
				}


				DrawDangerLineChart(averageDanger, "Chart1", "#008c9e", WIDTH, HEIGHT, start, end, "날짜별 평균 위험도", "", true);
				
				if(!flag1) DrawDangerBarChart(todayDanger, "Chart2", "#008c6d", WIDTH, HEIGHT, now, "("+now.toLocaleDateString("ko-KR") + ")의 위험도", onClickDangerBar);
				else onClickDangerBar("Chart2", flag1_mi);

				if(!flag2) DrawInoutBarChart(todayInout, "Chart3", "#004512", WIDTH, HEIGHT, now, "("+now.toLocaleDateString("ko-KR") + ")의 입출고량", onClickInoutBar);
				else onClickInoutBar("Chart3", flag2_mi);
				
				DrawActionTable(todayAction, "Chart4", WIDTH, HEIGHT, now, "("+now.toLocaleDateString("ko-KR") + ")의 행동에 따른 위험도 변화");
			}

			addEventListener("DOMContentLoaded", Draw);
		</script>
	</body>
</html>