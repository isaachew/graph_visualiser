var progress=0,targ=0
var speed=10
var animSteps=[]
var lastTime=null
var outputEnabled=true

var animFrame=null
function updateAnim(){
    animFrame=null
    var stepped=false
    try{
        for(;progress<targ&&progress<animSteps.length;progress++){
            stepped=true
            for(var j of animSteps[progress]){
                if(j.type=="vertex"){
                    curGraph.vertices[j.index].style=j.style
                }else if(j.type=="edge"){
                    curGraph.edges[j.index].style=j.style
                }else if(j.type=="output"){
                    if(outputEnabled){
                        var dvEl=document.createElement("div")
                        dvEl.append(j.text)
                        document.getElementById("algOutput").append(dvEl)
                    }
                }
            }
        }
    }catch(e){
        console.log("Error:",e)
        lastTime=null
        targ=progress
    }
    if(lastTime!=null){
        targ+=(+new Date-lastTime)*speed/1000
        lastTime=+new Date
    }
    if(stepped){
        document.getElementById("numSteps").textContent=Math.min(Math.ceil(targ),animSteps.length)+"/"+animSteps.length
        updateGraph()
    }
    if(progress<animSteps.length)animFrame=requestAnimationFrame(updateAnim)
}
function clearAnim(){
    curGraph.edges.map(a=>{delete a.style});curGraph.vertices.map(a=>{delete a.style})
    targ=0
    progress=0
    lastTime=null
    document.getElementById("numSteps").textContent=0+"/"+animSteps.length
    document.getElementById("playButton").textContent="Play"
    document.getElementById("algOutput").textContent=""
    updateGraph()
}
function startAnim(){
    clearAnim()
    lastTime=+new Date
    document.getElementById("playButton").textContent="Pause"
    progress=0
    targ=0
    document.getElementById("numSteps").textContent=0+"/"+animSteps.length
    if(animFrame==null)updateAnim()
}
document.getElementById("playButton").addEventListener("click",e=>{
    if(lastTime==null){
        lastTime=+new Date
        e.target.textContent="Pause"
        if(animFrame==null)updateAnim()
    }else{
        lastTime=null
        e.target.textContent="Play"
    }
})
document.getElementById("stepButton").addEventListener("click",e=>{
    targ++
    if(animFrame==null)updateAnim()
})
document.getElementById("speedInput").addEventListener("input",e=>{
    speed=2**e.target.value
})
document.getElementById("outputEnabled").addEventListener("input",e=>{
    outputEnabled=e.target.checked
})
