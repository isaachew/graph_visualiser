var width=600,height=600
var dpr=devicePixelRatio
var settings={
    vertexSize:20
}
var curGraph={
    vertices:[],
    edges:[]
}
var scale=2
var velocity=0
var rc=document.getElementById("drawCanvas").getContext("2d")
function getCanvCoords(x,y,sc=1){
    return [(x+scale/2)/scale*width*sc,(y+scale/2)/scale*width*sc]
}
function getDiagramCoords(x,y){
    return [(x/width-.5)*scale,(y/height-.5)*scale]
}
var mousePos={}
var dragging=0,dragIndex=0
function renderGraph(){
    rc.clearRect(0,0,width*dpr,height*dpr)
    rc.lineWidth=2.5*dpr
    for(var i=0;i<curGraph.edges.length;i++){
        rc.beginPath()
        var ev1=curGraph.vertices[curGraph.edges[i].v1]
        var ev2=curGraph.vertices[curGraph.edges[i].v2]
        rc.moveTo(...getCanvCoords(ev1.x,ev1.y,dpr))
        rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        rc.stroke()
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        rc.strokeStyle="#000"
        rc.lineWidth=5*dpr
        rc.fillStyle="#aaa"
        rc.beginPath()
        rc.arc(...getCanvCoords(cvert.x,cvert.y,dpr),settings.vertexSize*dpr,0,7,0)
        rc.stroke()
        rc.fill()
        rc.fillStyle="#000"
        rc.font=15*dpr+"px sans-serif"
        rc.textAlign="center"
        rc.textBaseline="middle"
        rc.fillText(i,...getCanvCoords(cvert.x,cvert.y,dpr))
    }
}
function updateGraph(){
    if(velocity){
        var vels=[]
        for(var i=0;i<curGraph.vertices.length;i++){
            vels.push([0,0])
        }
        for(var i=0;i<curGraph.edges.length;i++){//attract edges
            var ed=curGraph.edges[i]
            var v1=curGraph.vertices[ed.v1]
            var v2=curGraph.vertices[ed.v2]
            var dist=Math.hypot(v1.x-v2.x,v1.y-v2.y)
            var edgeLength=0.2
            vels[ed.v1][0]-=(v1.x-v2.x)/dist*(dist-edgeLength)
            vels[ed.v1][1]-=(v1.y-v2.y)/dist*(dist-edgeLength)
            vels[ed.v2][0]-=(v2.x-v1.x)/dist*(dist-edgeLength)
            vels[ed.v2][1]-=(v2.y-v1.y)/dist*(dist-edgeLength)
        }

        for(var i=0;i<curGraph.vertices.length;i++){
            for(var j=0;j<curGraph.vertices.length;j++){
                if(j==i)continue
                var v1=curGraph.vertices[i]
                var v2=curGraph.vertices[j]
                var dist=Math.hypot(v1.x-v2.x,v1.y-v2.y)
                vels[i][0]+=(v1.x-v2.x)/Math.max(dist**3,0.00001)/500
                vels[i][1]+=(v1.y-v2.y)/Math.max(dist**3,0.00001)/500
            }
        }

        for(var i=0;i<curGraph.vertices.length;i++){
            vels[i][0]-=curGraph.vertices[i].x/4
            vels[i][1]-=curGraph.vertices[i].y/4
            if(Number.isFinite(vels[i][0]**2+vels[i][1]**2)){
                curGraph.vertices[i].x+=vels[i][0]/10
                curGraph.vertices[i].y+=vels[i][1]/10
                //curGraph.vertices[i].x=Math.max(Math.min(curGraph.vertices[i].x,1),-1)
                //curGraph.vertices[i].y=Math.max(Math.min(curGraph.vertices[i].y,1),-1)
            }
        }
    }
    if(dragging){
        curGraph.vertices[dragIndex].x=mousePos.x
        curGraph.vertices[dragIndex].y=mousePos.y
    }
    renderGraph()
}
document.getElementById("drawCanvas").addEventListener("mousedown",e=>{
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var cvertPos=getCanvCoords(cvert.x,cvert.y)
        if(Math.hypot(cvertPos[0]-e.offsetX,cvertPos[1]-e.offsetY)<settings.vertexSize){
            dragIndex=i
            dragging=1
        }
    }
    mousePos.x=(e.offsetX/width-0.5)*scale
    mousePos.y=(e.offsetY/height-0.5)*scale
})

document.getElementById("drawCanvas").addEventListener("mousemove",e=>{
    mousePos.x=(e.offsetX/width-0.5)*scale
    mousePos.y=(e.offsetY/height-0.5)*scale
})
document.getElementById("drawCanvas").addEventListener("mouseup",e=>{
    dragging=0
})
for(var i=0;i<64;i++){
    curGraph.vertices.push({x:Math.random()-.5,y:Math.random()-.5})
    if(i)curGraph.edges.push({v1:i,v2:i*2%64})
}
setInterval(updateGraph,10)
