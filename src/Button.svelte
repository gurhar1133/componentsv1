<script>
    export let buttonTxt;
    export let mode = "default";
</script>

<style>
.default{
    color: #fff;
    background: rgb(167, 54, 167);
    border: 1px solid rgb(167, 54, 167);
    border-radius: 4px;
    margin: 0 1rem;
    padding: .5rem .5rem;
    border-bottom: 1px solid #ccc;
    margin-bottom: 1rem;
    cursor: pointer;
}
.default:hover{
    transition: background-color 0.5s ease-in-out;
    color: rgb(167, 54, 167);
    background: #fff;
    
}


</style>

<button class="{mode}" type="button">{buttonTxt}</button>