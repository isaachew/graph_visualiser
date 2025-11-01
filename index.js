var width=600,height=600
var dpr=devicePixelRatio
var settings={
    vertex:{
        size:20,
        labelSize:15,
        outlineCol:"#000",
        colour:"#aaa"
    },
    edge:{
        labelSize:15,
        labelColour:"#000",
        colour:"#000",
        width:1,
        labelDistance:10
    }
}
var curTool=""
var curGraph={
    vertices:[],
    edges:[]
}
var scale=2
var camPos=[0,0]
var velocity=0
var rc=document.getElementById("drawCanvas").getContext("2d")
function getCanvCoords(x,y,sc=1){
    return [((x-camPos[0])/scale*width+width/2)*sc,((y-camPos[1])/scale*width+height/2)*sc]
}
function getDiagramCoords(x,y){
    return [(x/width-.5)*scale+camPos[0],(y/width-.5)*scale+camPos[1]]
}
var mousePos=[0,0]
var lastClickPos=null//used to detect dragging
var clickTarget=null
var dragging=0,dragIndex=null

var selectedVertex=null
function renderGraph(){
    rc.clearRect(0,0,width*dpr,height*dpr)
    for(var i=0;i<curGraph.edges.length;i++){
        var curStyle=Object.assign({},settings.edge,curGraph.edges[i],curGraph.edges[i].style)
        rc.lineWidth=curStyle.width*dpr
        rc.strokeStyle=curStyle.colour
        rc.beginPath()
        var ev1=curGraph.vertices[curGraph.edges[i].v1]
        var ev2=curGraph.vertices[curGraph.edges[i].v2]
        rc.moveTo(...getCanvCoords(ev1.x,ev1.y,dpr))
        rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        rc.stroke()
        rc.fillStyle=curStyle.labelColour
        rc.font=curStyle.labelSize*dpr+"px sans-serif"
        rc.textAlign="center"
        rc.textBaseline="middle"
        var cdx=(ev2.y-ev1.y)
        var cdy=-(ev2.x-ev1.x)
        var dist=Math.hypot(ev2.x-ev1.x,ev2.y-ev1.y)
        var label=curGraph.edges[i]?.weight??i
        rc.fillText(label,...getCanvCoords((ev1.x+ev2.x)/2+cdx/dist*curStyle.labelDistance/width*scale,(ev1.y+ev2.y)/2+cdy/dist*curStyle.labelDistance/width*scale,dpr))
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var curStyle=Object.assign({},settings.vertex,cvert,cvert.style)
        rc.strokeStyle=curStyle.outlineCol
        rc.lineWidth=5*dpr*(1+(i==selectedVertex))
        rc.fillStyle=curStyle.colour
        rc.beginPath()
        rc.arc(...getCanvCoords(cvert.x,cvert.y,dpr),curStyle.size*dpr,0,7,0)
        rc.stroke()
        rc.fill()
        rc.fillStyle="#000"
        rc.font=curStyle.labelSize*dpr+"px sans-serif"
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
                vels[i][0]+=(v1.x-v2.x)/Math.max(dist**3,0.000001)/500
                vels[i][1]+=(v1.y-v2.y)/Math.max(dist**3,0.000001)/500
            }
        }

        for(var i=0;i<curGraph.vertices.length;i++){
            vels[i][0]-=curGraph.vertices[i].x/40
            vels[i][1]-=curGraph.vertices[i].y/40
            if(Number.isFinite(vels[i][0]**2+vels[i][1]**2)){
                curGraph.vertices[i].x+=vels[i][0]/40
                curGraph.vertices[i].y+=vels[i][1]/40
                //curGraph.vertices[i].x=Math.max(Math.min(curGraph.vertices[i].x,1),-1)
                //curGraph.vertices[i].y=Math.max(Math.min(curGraph.vertices[i].y,1),-1)
            }
        }
    }
    if(dragging&&dragIndex!=null){
        curGraph.vertices[dragIndex].x=mousePos[0]
        curGraph.vertices[dragIndex].y=mousePos[1]
    }
    renderGraph()
}
document.getElementById("drawCanvas").addEventListener("mousedown",e=>{
    clickTarget=null
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var cvertPos=getCanvCoords(cvert.x,cvert.y)
        var curStyle=Object.assign({},settings.vertex,cvert,graphStyles.vertices[i])
        if(Math.hypot(cvertPos[0]-e.offsetX,cvertPos[1]-e.offsetY)<(curStyle.size)){
            clickTarget=i
        }
    }

    mousePos=getDiagramCoords(e.offsetX,e.offsetY)
    lastClickPos=[e.offsetX,e.offsetY]
})

document.getElementById("drawCanvas").addEventListener("mousemove",e=>{
    if(lastClickPos&&Math.hypot(e.offsetX-lastClickPos[0],e.offsetY-lastClickPos[1])>3){
        dragging=1
        if(clickTarget!=null){
            dragIndex=clickTarget
        }else{

        }
    }
    mousePos=getDiagramCoords(e.offsetX,e.offsetY)
    if(dragging&&clickTarget==null){
        camPos[0]-=e.movementX/width*scale
        camPos[1]-=e.movementY/width*scale
    }
})
document.getElementById("drawCanvas").addEventListener("mouseup",e=>{
    if(!dragging){
        if(clickTarget!=null){
            if(selectedVertex==null){
                selectedVertex=clickTarget
                if(curTool=="delete"){
                    curGraph.vertices.splice(clickTarget,1)
                    for(var i=0;i<curGraph.edges.length;i++){
                        var curEdge=curGraph.edges[i]
                        if(curEdge.v1==clickTarget||curEdge.v2==clickTarget){
                            curGraph.edges.splice(i,1)
                            i--
                            continue
                        }
                        if(curEdge.v1>clickTarget)curEdge.v1--
                        if(curEdge.v2>clickTarget)curEdge.v2--
                    }
                    selectedVertex=null
                }
            }else{
                if(selectedVertex!=clickTarget){
                    var canAdd=true
                    for(var i=0;i<curGraph.edges.length;i++){
                        var curEdge=curGraph.edges[i]
                        if(curEdge.v1==selectedVertex&&curEdge.v2==clickTarget){
                            canAdd=false
                            curGraph.edges.splice(i,1)
                            break
                        }
                    }
                    if(canAdd)curGraph.edges.push({v1:selectedVertex,v2:clickTarget})
                }
                selectedVertex=null
            }
        }else{
            selectedVertex=null
            curGraph.vertices.push({x:mousePos[0],y:mousePos[1]})
        }
    }
    dragging=0
    dragIndex=null
    clickTarget=null
    lastClickPos=null
})

document.getElementById("deleteModeButton").addEventListener("click",e=>{
    if(curTool=="delete"){
        curTool=""
        e.target.textContent="delete"
    }else{
        curTool="delete"

        e.target.textContent="draw"
    }
})
curGraph.vertices.push({x:Math.random()-.5,y:Math.random()-.5})

setInterval(updateGraph,10)
