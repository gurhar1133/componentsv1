<script>
	import List from "./List.svelte";
	import Card from "./Card.svelte";
	let lists;
	let cards;
	let items = [{name: "Milk"},
				{name: "Sugar"},
				{name:"Flour"},
				{name:"Rice"},
				{name:"Chia"}
				];
	let options = [{name: "like"},
				{name: "favorite"},
				{name:"subscribe"},
				{name:"follow"}
				];
	let itemsWIcon = [
		{name:"Salt", icon: "x"},
		{name:"Potatoes", icon: "x"},
		{name:"Cabbage", icon: "x"}
		];
	const selectionMade = (event)=>{
			console.log(event.detail.selection.trim());
			let selector = event.detail.selection.trim();
			if (selector === "lists"){
				lists.scrollIntoView();
			}
			else if(selector === "cards"){
				cards.scrollIntoView();
			}
		};
	
</script>

<style>
	.slotP{
		text-align: right;
	}
	.slotImg{
		width: 50%;
		height: 50%;
	}
</style>
<!-- Using a list component as a navbar-->

<List 	items="{[{name: "lists"}, {name: "cards"}]}" 
		title="{" Component Library Menu"}" 
		dropDown={true} 
		horizontal={false}
		darkMode="{true}"
		showIcons="{false}"
		on:select={selectionMade}
		/>


<div bind:this={lists}>
<h2>Lists:</h2>

<List 	items="{items}" 
		title="{"Horizontal List: "}" 
		dropDown={false} 
		horizontal={true}
		darkMode="{false}"
		showIcons="{false}"
		/>

<List 	items="{itemsWIcon}" 
		title="{"My List Two"}" 
		dropDown={true} 
		horizontal={false}
		darkMode="{false}"
		showIcons="{true}"
	/>

	<List 	items="{itemsWIcon}" 
		title="{"Dark List"}" 
		dropDown={true} 
		horizontal={false}
		darkMode="{true}"
		showIcons="{true}"
	/>


<List 	items="{itemsWIcon}" 
		title="{"Dark Horizontal"}" 
		dropDown={true} 
		horizontal={true}
		darkMode="{true}"
		showIcons="{true}"
	/>

</div>

<div bind:this={cards}>
<h2>Cards:</h2>
<Card title="{"Card 1"}"
		image="{"https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg"}"
		subtitle={"Card without slot Data"} 
		desc="{"This default card does not have slot data"}"/>

<Card title="{"Card 1"}"
	desc="{"This card has custom slot data"}"
	subtitle={"Subtitle"}
>
	<div style="text-align: center;" slot="middle">
		<img class="slotImg" src="https://pbs.twimg.com/profile_images/1053055123193122816/IUwo6l_Q_400x400.jpg" alt="">
		<p class="slotP"> This text is to the right (not the default)</p>
	</div>
	
</Card>

<Card 	
		mode="shaped"
		image="{"https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg"}"
		
		title="{"Shaped Card"}"
		subtitle={"Not default mode"} 
		desc="{"Setting mode attr of this card to shaped gave this card it's shape"}"/>



<Card title={"Layout 2 card"}
		mode="shaped"
		subtitle="{"Card with corner badge"}"
		image="{"https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Vegeta_Dragon_Ball.jpg/220px-Vegeta_Dragon_Ball.jpg"}"
		desc={"This card has a different layout, but has shaped mode"}
		layout="layout-2"
	/>

<Card title="{"Simple outline Mode Card"}"
		image="{"https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg"}"
		mode="outlined"
		desc="{"no shadow here"}"/>

<Card title={"Layout 2 with buttons"}
		subtitle="{"---"}"
		image="{"https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Vegeta_Dragon_Ball.jpg/220px-Vegeta_Dragon_Ball.jpg"}"
		desc={"Nested components. A button list component is nested in this card"}
		layout="layout-2"
	>
	
	<div slot="bottom">
		<h5>options:</h5>
		<List
			horizontal={true}
			items={options}
			buttonList={true}
		/>
	</div>

</Card>
</div>