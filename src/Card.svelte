<script>
    export let title;
    export let image;
    export let subtitle = "";
    export let desc = "";
    export let mode = "card";
    export let layout = "default";
    export let expandable;
    export let expandText = "expand";
    let tempMode;
    let tempText;

    function expand(){
        if (expandable){
            if (mode !== "cardExpanded"){
                tempMode = mode;
                mode = "cardExpanded";
                tempText = expandText;
                expandText = "close";
            }
            else{
                mode = tempMode;
                expandText = tempText;
            }
        }
    };

</script>

<style>

.card{
    border: 1px solid #aaa;
    border-radius: 4px;
    box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
    width: 70%;
    height: 80%;
    max-width: 600px;
    padding: 1rem 1rem;
    margin: 1rem 1rem 1rem 1rem;
}
.raised{
    border: 1px solid #aaa;
    border-radius: 4px;
    box-shadow: 3px 3px 5px 6px #ccc;
    width: 70%;
    height: 80%;
    max-width: 600px;
    padding: 1rem 1rem;
    margin: 1rem 1rem 1rem 1rem;
}
.cardExpaned{
    position: absolute;
    top: 0;
    /* bottom: 0; */
    right: 0;
    
    height: 100%;
    padding: 1rem 1rem;
    margin: 1rem 1rem 1rem 1rem;
    border: 1px solid #aaa;
    border-radius: 4px;
}
.outlined{
    border: 1px solid #aaa;
    border-radius: 4px;
    width: 70%;
    height: 80%;
    max-width: 600px;
    padding: 1rem 1rem;
    margin: 1rem 1rem 1rem 1rem;
}
.shaped{
     border: 1px solid #aaa;
    border-top-left-radius: 20px;
    border-bottom-right-radius: 20px;
    box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
    width: 70%;
    height: 80%;
    max-width: 600px;
    padding: 1rem 1rem;
    margin: 1rem 1rem 1rem 1rem;
}
.title{
    
}
.subtitle{
    color: #666;
    
}
.image{
    max-width: 50%;
    max-height: 50%;
}
.image-span{
    text-align: center;
}
.image-span2{
    text-align:right;
    position: relative;
    
}
.image-2{
    position: absolute;
    top: -10px;
    right: 0;
    border: 0px;
    width: 4rem;
    border-radius: 80px;
}
.expBtn{
    
    color: #fff;
    background: rgb(167, 54, 167);
    padding: .5rem 1rem;
    margin: 0 .5rem;
    border-radius: 6px;
}
.expBtn:hover{
    color: rgb(167, 54, 167);
    background: #fff;
    border: 1px solid rgb(167, 54, 167);
    cursor: pointer;
}

</style>
{#if layout === "layout-2"}
    <div class="{mode}" >
    <div class="image-span2">
        <img class="image-2" src="{image}" alt=""/>
    </div>
    {#if expandable}
        <span class="expBtn" on:click={expand}>{expandText}</span>
    {/if}
    <div class="title">
        <h2>{title}</h2>
    </div>
    
    
    <div class="subtitle">
        <h3>{subtitle}</h3>
    </div>
    <hr>
    <slot name="custom"></slot>
    <div class="desc">
        <p>{desc}</p>
    </div>
    <slot name="bottom"></slot>
</div>
{:else if layout === "default"}

<div class="{mode}" >
    {#if expandable}
        <span class="expBtn" on:click={expand}>{expandText}</span>
    {/if}
    <div class="title">
        <h2>{title}</h2>
    </div>
    <div class="image-span">
        <img class="image" src="{image}" alt=""/>
    </div>
    
    <div class="subtitle">
        <h3>{subtitle}</h3>
    </div>
    <hr>
    <slot name="middle"></slot>
    <div class="desc">
        <p>{desc}</p>
    </div>
    <slot name="bottom"></slot>
</div>
{/if}