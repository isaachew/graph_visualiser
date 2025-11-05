var progress=0,targ=0
var speed=10
var animSteps=[]
var lastTime=null
setInterval(()=>{
    //if(progress>=scs.length){clearInterval(interv);return}
    for(;progress<=targ&&progress<animSteps.length;progress++){
        for(var j of animSteps[progress]){
            if(j.type=="vertex"){
                curGraph.vertices[j.index].style=j.style
            }else if(j.type=="edge"){
                curGraph.edges[j.index].style=j.style
            }
        }
    }
    if(lastTime!=null){
        targ+=(+new Date-lastTime)*speed/1000
        lastTime=+new Date
    }
},10)
function clearAnim(){
    curGraph.edges.map(a=>{delete a.style});curGraph.vertices.map(a=>{delete a.style})
}
function startAnim(){
    clearAnim()
    lastTime=+new Date
    progress=0
    targ=0
}
