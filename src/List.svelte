<script>
    // props to add:
    // light and dark themes
    //
    import {createEventDispatcher} from "svelte";
    import {slide, fly} from "svelte/transition";
    const dispatch = createEventDispatcher();
    export let items;
    export let title;
    export let dropDown = false;
    export let horizontal = false;
    export let darkMode = false;
    export let showIcons;
    export let buttonList = false;
    let dropDownState = "closed";
    let dropDownText = "+";

    function selectItem(event){
        let selection = event.target.textContent;
        dispatch("select", {selection: selection});
        
    }

    function changeDropDownState(){
        if (dropDownState === "closed"){
            dropDownState = "open";
            dropDownText = "-"
        }
        else {
            dropDownState = "closed";
            dropDownText = "+";
        }
    }
</script>
<style>
.dark{
    background-color: rgba(0,0,0,.7);
    color: white;
}
.list{
    max-width: 80%;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
    margin: 1rem 1rem 1rem 1rem;
}
.listHor{
    display: flex;
    max-width: 80%;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
    margin: 1rem 1rem 1rem 1rem;
}
.listHead{
    position: relative;
    display: flex;
    padding: .5rem .5rem;
    
    
   
}
.listHeadDark{
    position: relative;
    display: flex;
    padding: .5rem .5rem;
    background: rgb(30,30,30);
}
.listItem{
    margin: 0 1rem;
    padding: .5rem .5rem;
    border-bottom: 1px solid #ccc;
    margin-bottom: 1rem;
    cursor: pointer;
}
.listItemHor{
    margin-top: 1rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-top: 1.5rem;
    padding-bottom: 1rem;
    margin-bottom: 0rem;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}
.listItemDark{
    margin: 0 1rem;
    padding: .5rem .5rem;
    border-bottom: 1px solid #ccc;
    margin-bottom: 1rem;
    cursor: pointer;
}
.listItemHorDark{
    margin-top: 1rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-top: 1.5rem;
    padding-bottom: 1rem;
    margin-bottom: 0rem;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}
.listItemHorDark:hover{
    transition: background-color 0.5s ease-in-out;
    background-color: #fff;
    color: black;
    /* border: 0px solid #ccc; */
    border-bottom: 0px solid #ccc;
    /* border-radius: 20px; */
    border-top-right-radius: 20px;
    border-top-left-radius: 20px;
}
.listItemDark:hover{
    transition: background-color 0.5s ease-in-out;
    background-color: #fff;
    padding-left: 3rem;
    color: black;
    border: 0px solid #ccc;
    border-bottom: 1px solid #ccc;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
}
.listItemHor:hover{
    transition: background-color 0.5s ease-in-out;
    background-color: #bbb;
    color: white;
    /* border: 0px solid #ccc; */
    border-bottom: 0px solid #ccc;
    /* border-radius: 20px; */
    border-top-right-radius: 20px;
    border-top-left-radius: 20px;
}
.listItem:hover{
    transition: background-color 0.5s ease-in-out;
    background-color: #bbb;
    padding-left: 3rem;
    color: white;
    border: 0px solid #ccc;
    border-bottom: 1px solid #ccc;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
}
.dropBtnHor{
    border: 0px solid #ccc;
    margin-right: 1rem;
    color: black;
    background-color: white;
    margin-left: 1rem;
    font-size: 25px;
    padding-left: .5rem;
    padding-right: .5rem;
    padding-top: .2rem;
    padding-bottom: .2rem;
    cursor: pointer;
}
.dropBtnHorDark{
    border: 0px solid #ccc;
    margin-right: 1rem;
    color: white;
    background-color: rgba(30,30,30,.7);
    margin-left: 1rem;
    font-size: 25px;
    padding-left: .5rem;
    padding-right: .5rem;
    padding-top: .2rem;
    padding-bottom: .2rem;
    cursor: pointer;
}
.dropBtnDark{
    color: white;
    background-color: rgba(30,30,30,.7);
    border: 0px solid #ccc;
    position: absolute;
    
    margin-right: 1rem;
    font-size: 25px;
    top:18%;
    right: 0;
    
    margin-left: 1rem;
    padding: 1rem 1rem 1rem 1rem;
    cursor: pointer;
}
.dropBtn{
    border: 0px solid #ccc;
    position: absolute;
    color: black;
    margin-right: 1rem;
    font-size: 25px;
    top:18%;
    right: 0;
    background-color: white;
    margin-left: 1rem;
    padding: 1rem 1rem 1rem 1rem;
    cursor: pointer;
    
}

.buttonList{
    display: flex;
}
.buttonListBtn{
    color: rgb(167, 54, 167);
    border: 1px solid rgb(167, 54, 167);
    background: #fff;
    padding: .5rem 1rem;
    margin: 0 .5rem;
    border-radius: 6px;
}
.buttonListBtn:hover{
    color: #fff;
    background: rgb(167, 54, 167);
    cursor: pointer;
}

</style>

{#if darkMode && !buttonList}
<div class="{horizontal ? "listHor" : "list"} dark">
    
    {#if dropDown}
        <div class="listHeadDark">
            <h3>{title}</h3>
            <button class="{horizontal ? "dropBtnHorDark" : "dropBtnDark"}" on:click={changeDropDownState}> {dropDownText} </button>
        </div>
        
        {#if dropDownState === "open"}
            {#each items as item}
                {#if horizontal}
                    <div on:click={selectItem} transition:slide class="listItemHorDark">
                        {#if showIcons}
                            <span id="icon"> {item.icon} </span>
                        {/if}
                        <span id="itemText"> {item.name} </span>
                    </div>
                {:else}
                <div on:click={selectItem} transition:slide class="listItemDark">
                    {#if showIcons}
                            <span id="icon"> {item.icon} </span>
                    {/if}
                    <span id="itemText"> {item.name} </span>
                </div>
                {/if}
            {/each}
        {/if}
    {:else}
    <div class="listHead">
        <h3>{title}</h3>
    </div>
        
    {#each items as item}
        <div on:click={selectItem} class={horizontal ? "listItemHor" : "listItem"}>
            {#if showIcons}
                <span id="icon"> {item.icon} </span>
            {/if}
            <span id="itemText"> {item.name} </span>
        </div>
    {/each}
    {/if}
</div>
{:else if !buttonList}
<div class="{horizontal ? "listHor" : "list"}">
    
    {#if dropDown}
        <div class="listHead">
            <h3>{title}</h3>
            <button class={horizontal ? "dropBtnHor" : "dropBtn"} on:click={changeDropDownState}> {dropDownText} </button>
        </div>
        
        {#if dropDownState === "open"}
            {#each items as item}
                {#if horizontal}
                    <div on:click={selectItem} transition:fly={{x:-100, y:-100, duration: 500}} class={horizontal ? "listItemHor" : "listItem"}>
                        {#if showIcons}
                            <span id="icon"> {item.icon} </span>
                        {/if}
                        <span id="itemText"> {item.name} </span>
                    </div>
                {:else}
                <div on:click={selectItem} transition:slide class={horizontal ? "listItemHor" : "listItem"}>
                    {#if showIcons}
                            <span id="icon"> {item.icon} </span>
                    {/if}
                    <span id="itemText"> {item.name} </span>
                </div>
                {/if}
            {/each}
        {/if}
    {:else}
    <div class="listHead">
        <h3>{title}</h3>
    </div>
        
    {#each items as item}
        <div on:click={selectItem} class={horizontal ? "listItemHor" : "listItem"}>
            {#if showIcons}
                <span id="icon"> {item.icon} </span>
            {/if}
            <span id="itemText"> {item.name} </span>
        </div>
    {/each}
    {/if}
</div>
{/if}


{#if buttonList}

    <div class="buttonList">
            {#each items as item}
                    <div on:click={selectItem} transition:fly={{x:-100, y:-100, duration: 500}} class="buttonListBtn">
                        {#if showIcons}
                            <span id="icon"> {item.icon} </span>
                        {/if}
                        <span id="itemText"> {item.name} </span>
                    </div>
            {/each}
            </div>
{/if}
