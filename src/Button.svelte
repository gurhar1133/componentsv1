<script>
    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();
    export let buttonTxt;
    export let mode = "default";
    let tempMode;
    function activate(){
        // dispatches click to parent component so
        // you can use on:click there as well.
        dispatch("click");
        // animates button
        if(!mode.includes("Active")){
            tempMode = mode;
            mode = mode + "Active";
            setTimeout(()=>{
                mode = tempMode;
            }, 500);
        }
    }


</script>

<style>
.default{
    transition: background-color 0.7s ease;
    color: #fff;
    background: rgb(167, 54, 167);
    border: 1px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}
.defaultActive{
    transition: background-color 0.7s ease;
    color: rgb(167, 54, 167);
    background:#fff;
    border: 1px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}

.outline{
    transition: background-color 0.7s ease;
    color: rgb(167, 54, 167);
    background: #fff;
    border: 1px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem 1rem;
   
    margin-bottom: 1rem;
    cursor: pointer;
}
.outlineActive{
    transition: background-color 0.7s ease;
    color: #fff;
    background: rgb(167, 54, 167);
    border: 1px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}
.rounded{
    transition: background-color 0.7s ease;
    color: #fff;
    background: rgb(167, 54, 167);
    border: 1px solid rgb(167, 54, 167);
    border-radius: 30px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}
.roundedActive{
    transition: background-color 0.7s ease;
    color: rgb(167, 54, 167);
    background: #fff;
    border: 1px solid rgb(167, 54, 167);
    border-radius: 30px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}
.text{
    transition: all 0.4s ease;
    color: rgb(167, 54, 167);
    background: #fff;
    border: 0px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}
.text:hover{
    background: rgb(240, 208, 240);
}
.textActive{
    transition: all 0.4s ease;
    color: #fff;
    background: rgb(167, 54, 167);
    border: 0px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem 1rem;
    
    margin-bottom: 1rem;
    cursor: pointer;
}
</style>

<button class="{mode}" type="button" on:click={activate}>{buttonTxt}</button>