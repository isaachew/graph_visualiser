var dpr=devicePixelRatio
var width=600,height=600
var canvas=document.getElementById("drawCanvas")
canvas.width=width*dpr
canvas.height=height*dpr
canvas.style.width=width+"px"
var settings={
    vertex:{
        size:20,
        labelSize:15,
        outlineCol:"#000000",
        colour:"#aaaaaa"
    },
    edge:{
        labelSize:15,
        labelColour:"#000000",
        colour:"#000000",
        width:1,
        labelDistance:10
    },
    curvedEdges:true,
    directedEdgeDist:0.02
}
var curTool="draw"
var curGraph={
    vertices:[],
    edges:[]
}
var scale=2
var camPos=[0,0]
var velocity=0
var rc=canvas.getContext("2d")
function getCanvCoords(x,y,sc=1){
    return [((x-camPos[0])/scale*width+width/2)*sc,((y-camPos[1])/scale*width+height/2)*sc]
}
function getDiagramCoords(x,y){
    return [(x-width/2)/width*scale+camPos[0],(y-height/2)/width*scale+camPos[1]]
}
var mousePos=[0,0]//mouse position in canvas coords
var lastMousePos=null//last position of mouse in page coords, to detect dragging
var clickTarget=null
var dragging=0,dragIndex=null

var selectedVertex=null
var selectedEdge=null
var adjListEnabled=0,adjMatrixEnabled=0
function getStyle(...args){
    var ob={}
    for(var i of args){
        for(var j in i){
            ob[j]=i[j]??ob[j]
        }
    }
    return ob
}
function renderGraph(){
    rc.clearRect(0,0,width*dpr,height*dpr)
    var adjList={}
    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        adjList[curEdge.v1+" "+curEdge.v2]=1
    }
    for(var i=0;i<curGraph.edges.length;i++){
        var curStyle=getStyle(settings.edge,curGraph.edges[i],curGraph.edges[i].style)
        rc.lineWidth=curStyle.width*dpr*(1+(i==selectedEdge))
        rc.strokeStyle=curStyle.colour
        rc.beginPath()
        var ev1=curGraph.vertices[curGraph.edges[i].v1]
        var ev2=curGraph.vertices[curGraph.edges[i].v2]
        //rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        var directedDist=adjList[curGraph.edges[i].v2+" "+curGraph.edges[i].v1]?settings.directedEdgeDist:0
        if(curGraph.edges[i].directed&&directedDist){
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            if(settings.curvedEdges){
                rc.moveTo(...getCanvCoords(ev1.x,ev1.y,dpr))
                rc.quadraticCurveTo(...getCanvCoords((ev1.x+ev2.x)/2+(ev2.y-ev1.y)/ev1ev2d*directedDist*2,(ev1.y+ev2.y)/2-(ev2.x-ev1.x)/ev1ev2d*directedDist*2,dpr),...getCanvCoords(ev2.x,ev2.y,dpr))
            }else{
                rc.moveTo(...getCanvCoords(ev1.x+(ev2.y-ev1.y)/ev1ev2d*directedDist,ev1.y-(ev2.x-ev1.x)/ev1ev2d*directedDist,dpr))
                rc.lineTo(...getCanvCoords(ev2.x+(ev2.y-ev1.y)/ev1ev2d*directedDist,ev2.y-(ev2.x-ev1.x)/ev1ev2d*directedDist,dpr))
            }
        }else{
            rc.moveTo(...getCanvCoords(ev1.x,ev1.y,dpr))
            rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        }
        rc.stroke()
        if(curGraph.edges[i].directed){//draw arrow
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            var ev1ev2rat=0.5
            var arrSizeX=0.03
            var arrSizeY=0.01
            rc.beginPath()
            rc.moveTo(...getCanvCoords(ev1.x+(ev2.x-ev1.x)*ev1ev2rat+((ev2.x-ev1.x)*(-arrSizeX/2)-(ev2.y-ev1.y)*(arrSizeY-directedDist))/ev1ev2d,ev1.y+(ev2.y-ev1.y)*ev1ev2rat+((ev2.y-ev1.y)*(-arrSizeX/2)+(ev2.x-ev1.x)*(arrSizeY-directedDist))/ev1ev2d,dpr))
            rc.lineTo(...getCanvCoords(ev1.x+(ev2.x-ev1.x)*ev1ev2rat+((ev2.x-ev1.x)*(-arrSizeX/2)-(ev2.y-ev1.y)*(-arrSizeY-directedDist))/ev1ev2d,ev1.y+(ev2.y-ev1.y)*ev1ev2rat+((ev2.y-ev1.y)*(-arrSizeX/2)+(ev2.x-ev1.x)*(-arrSizeY-directedDist))/ev1ev2d,dpr))//back and down
            rc.lineTo(...getCanvCoords(ev1.x+(ev2.x-ev1.x)*ev1ev2rat+((ev2.x-ev1.x)*(arrSizeX/2)-(ev2.y-ev1.y)*(-directedDist))/ev1ev2d,ev1.y+(ev2.y-ev1.y)*ev1ev2rat+((ev2.y-ev1.y)*(arrSizeX/2)+(ev2.x-ev1.x)*(-directedDist))/ev1ev2d,dpr))//back and down
            rc.closePath()
            rc.fill()
        }
        if(curStyle.labelSize){
            rc.fillStyle=curStyle.labelColour
            rc.font=curStyle.labelSize*dpr+"px sans-serif"
            rc.textAlign="center"
            rc.textBaseline="middle"
            var cdx=(ev2.y-ev1.y)
            var cdy=-(ev2.x-ev1.x)
            var dist=Math.hypot(ev2.x-ev1.x,ev2.y-ev1.y)
            var label=curStyle.label??curGraph.edges[i].weight
            if(label!=null)rc.fillText(label,...getCanvCoords((ev1.x+ev2.x)/2+cdx/dist*(curStyle.labelDistance/width*scale+directedDist),(ev1.y+ev2.y)/2+cdy/dist*(curStyle.labelDistance/width*scale+directedDist),dpr))
        }
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var curStyle=getStyle(settings.vertex,cvert,cvert.style)
        rc.strokeStyle=curStyle.outlineCol
        rc.lineWidth=5*dpr*(1+(i==selectedVertex))
        rc.fillStyle=curStyle.colour
        if(curStyle.size){
            rc.beginPath()
            rc.arc(...getCanvCoords(cvert.x,cvert.y,dpr),curStyle.size*dpr,0,7,0)
            rc.stroke()
            rc.fill()
        }
        if(curStyle.labelSize){
            rc.fillStyle="#000"
            rc.font=curStyle.labelSize*dpr+"px sans-serif"
            rc.textAlign="center"
            rc.textBaseline="middle"
            rc.fillText(curStyle.label??i,...getCanvCoords(cvert.x,cvert.y,dpr))
        }
    }
}
function renderMatrix(){

    var mat=document.getElementById("adjMatrix")
    mat.textContent=""
    var hr=document.createElement("tr")
    mat.append(hr)
    var bl=document.createElement("th")
    hr.append(bl)
    for(var i=0;i<curGraph.vertices.length;i++){
        var vert=document.createElement("th")
        vert.append(curGraph.vertices[i].label??i)
        hr.append(vert)
    }
    var curMat=[...Array(curGraph.vertices.length)].map(a=>[...Array(curGraph.vertices.length)].map(a=>null))

    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        curMat[curEdge.v1][curEdge.v2]=curEdge.weight??1
        if(!curEdge.directed)curMat[curEdge.v2][curEdge.v1]=curEdge.weight??1
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var crow=document.createElement("tr")
        var vert=document.createElement("th")
        vert.append(curGraph.vertices[i].label??i)
        crow.append(vert)
        for(var j=0;j<curGraph.vertices.length;j++){
            var cent=document.createElement("td")
            cent.append(curMat[j][i]??"-")
            crow.append(cent)
        }
        mat.append(crow)
    }
}
function renderAdjList(){

    var mat=document.getElementById("adjList")
    mat.textContent=""
    var curList=[...Array(curGraph.vertices.length)].map(a=>[])

    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        curList[curEdge.v1].push([curEdge.v2,curEdge.weight])
        if(!curEdge.directed)curList[curEdge.v2].push([curEdge.v1,curEdge.weight])
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var crow=document.createElement("tr")
        var vert=document.createElement("th")
        vert.append(curGraph.vertices[i].label??i)
        crow.append(vert)
        for(var j=0;j<curList[i].length;j++){
            var cent=document.createElement("td")
            var vlabel=curGraph.vertices[curList[i][j][0]].label??curList[i][j][0]
            var strep=vlabel+(curList[i][j][1]==null?"":","+curList[i][j][1])
            cent.append(strep??"-")
            crow.append(cent)
        }
        mat.append(crow)
    }
}

function renderGraphSVG(){
    var svel=document.createElementNS("http://www.w3.org/2000/svg","svg")
    svel.setAttribute("xmlns","http://www.w3.org/2000/svg")
    svel.setAttribute("viewBox",`${camPos[0]-scale/2} ${camPos[1]-scale/2} ${scale} ${scale}`)
    svel.setAttribute("width","600")
    svel.style.fontSize=settings.edge.labelSize/width*scale
    var stel=document.createElementNS("http://www.w3.org/2000/svg","style")
    stel.append("text{dominant-baseline:middle;text-anchor:middle;font-family:Arial}")
    svel.appendChild(stel)
    var adjList={}
    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        adjList[curEdge.v1+" "+curEdge.v2]=1
    }
    for(var i=0;i<curGraph.edges.length;i++){
        var curStyle=getStyle(settings.edge,curGraph.edges[i],curGraph.edges[i].style)
        var pel=document.createElementNS("http://www.w3.org/2000/svg","path")
        pel.style.strokeWidth=curStyle.width/width*scale
        pel.style.stroke=curStyle.colour

        var peld=""
        var ev1=curGraph.vertices[curGraph.edges[i].v1]
        var ev2=curGraph.vertices[curGraph.edges[i].v2]
        //rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        var directedDist=adjList[curGraph.edges[i].v2+" "+curGraph.edges[i].v1]?settings.directedEdgeDist:0
        if(curGraph.edges[i].directed&&directedDist){
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            if(settings.curvedEdges){
                peld+="M"+[ev1.x,ev1.y]
                peld+="Q"+[(ev1.x+ev2.x)/2+(ev2.y-ev1.y)/ev1ev2d*directedDist*2,(ev1.y+ev2.y)/2-(ev2.x-ev1.x)/ev1ev2d*directedDist*2]+","+[ev2.x,ev2.y]
            }else{
                peld+="M"+[ev1.x+(ev2.y-ev1.y)/ev1ev2d*directedDist,ev1.y-(ev2.x-ev1.x)/ev1ev2d*directedDist]
                peld+="L"+[ev2.x+(ev2.y-ev1.y)/ev1ev2d*directedDist,ev2.y-(ev2.x-ev1.x)/ev1ev2d*directedDist]
            }
        }else{
            peld+="M"+[ev1.x,ev1.y]
            peld+="L"+[ev2.x,ev2.y]
        }
        pel.setAttribute("d",peld)
        pel.setAttribute("fill","none")
        svel.append(pel)
        if(curGraph.edges[i].directed){//draw arrow
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            var ev1ev2rat=0.5
            var arrSizeX=0.03
            var arrSizeY=0.01
            var pel=document.createElementNS("http://www.w3.org/2000/svg","path")
            var peld=""
            peld+="M"+[ev1.x+(ev2.x-ev1.x)*ev1ev2rat+((ev2.x-ev1.x)*(-arrSizeX/2)-(ev2.y-ev1.y)*(arrSizeY-directedDist))/ev1ev2d,ev1.y+(ev2.y-ev1.y)*ev1ev2rat+((ev2.y-ev1.y)*(-arrSizeX/2)+(ev2.x-ev1.x)*(arrSizeY-directedDist))/ev1ev2d]
            peld+="L"+[ev1.x+(ev2.x-ev1.x)*ev1ev2rat+((ev2.x-ev1.x)*(-arrSizeX/2)-(ev2.y-ev1.y)*(-arrSizeY-directedDist))/ev1ev2d,ev1.y+(ev2.y-ev1.y)*ev1ev2rat+((ev2.y-ev1.y)*(-arrSizeX/2)+(ev2.x-ev1.x)*(-arrSizeY-directedDist))/ev1ev2d]//back and down
            peld+="L"+[ev1.x+(ev2.x-ev1.x)*ev1ev2rat+((ev2.x-ev1.x)*(arrSizeX)/2-(ev2.y-ev1.y)*(-directedDist))/ev1ev2d,ev1.y+(ev2.y-ev1.y)*ev1ev2rat+((ev2.y-ev1.y)*(arrSizeX/2)+(ev2.x-ev1.x)*(-directedDist))/ev1ev2d]//back and down
            peld+="Z"
            pel.setAttribute("d",peld)
            svel.append(pel)
        }
        if(curStyle.labelSize){
            rc.fillStyle=curStyle.labelColour
            var cdx=(ev2.y-ev1.y)
            var cdy=-(ev2.x-ev1.x)
            var dist=Math.hypot(ev2.x-ev1.x,ev2.y-ev1.y)
            var label=curStyle.label??curGraph.edges[i].weight

            if(label!=null){
                var pel=document.createElementNS("http://www.w3.org/2000/svg","text")
                pel.setAttribute("x",(ev1.x+ev2.x)/2+cdx/dist*(curStyle.labelDistance/width*scale+directedDist))
                pel.setAttribute("y",(ev1.y+ev2.y)/2+cdy/dist*(curStyle.labelDistance/width*scale+directedDist))
                pel.setAttribute("font-size",curStyle.labelSize/width*scale)
                pel.setAttribute("fill",curStyle.labelColour)

                pel.append(label)
                svel.append(pel)
            }
        }
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var curStyle=getStyle(settings.vertex,cvert,cvert.style)
        rc.strokeStyle=curStyle.outlineCol
        rc.lineWidth=5*dpr*(1+(i==selectedVertex))
        rc.fillStyle=curStyle.colour
        if(curStyle.size){
            var pel=document.createElementNS("http://www.w3.org/2000/svg","circle")
            pel.setAttribute("cx",cvert.x)
            pel.setAttribute("cy",cvert.y)
            pel.setAttribute("r",curStyle.size/width*scale)
            pel.setAttribute("fill",curStyle.colour)
            pel.setAttribute("stroke",curStyle.outlineCol)
            pel.setAttribute("stroke-width",5/width*scale/2)
            svel.appendChild(pel)
        }
        if(curStyle.labelSize){
            var pel=document.createElementNS("http://www.w3.org/2000/svg","text")
            pel.textContent=curStyle.label??i
            pel.setAttribute("x",cvert.x)
            pel.setAttribute("y",cvert.y)
            pel.setAttribute("font-size",curStyle.labelSize/width*scale)
            svel.appendChild(pel)
            /*rc.fillStyle="#000"
            rc.font=curStyle.labelSize*dpr+"px sans-serif"
            rc.textAlign="center"
            rc.textBaseline="middle"
            */
        }
    }
    var obj=new Blob([svel.outerHTML],{type:"image/svg+xml"})
    var ourl=URL.createObjectURL(obj)
    var lnk=document.createElement("a")
    lnk.download="graph.svg"
    lnk.href=ourl
    lnk.click()
    URL.revokeObjectURL(ourl)
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
    requestAnimationFrame(updateGraph)
}
document.getElementById("drawCanvas").addEventListener("mousedown",e=>{
    clickTarget=null
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var cvertPos=getCanvCoords(cvert.x,cvert.y)
        var curStyle=Object.assign({},settings.vertex,cvert,cvert.style)
        if(Math.hypot(cvertPos[0]-e.offsetX,cvertPos[1]-e.offsetY)<(curStyle.size)){
            clickTarget=i
        }
    }

    mousePos=getDiagramCoords(e.offsetX,e.offsetY)
    lastMousePos=[e.offsetX,e.offsetY]
})

document.addEventListener("mousemove",e=>{
    if(lastMousePos&&Math.hypot(e.offsetX-lastMousePos[0],e.offsetY-lastMousePos[1])>3){
        dragging=1
        if(clickTarget!=null){
            dragIndex=clickTarget
        }else{

        }
    }
    if(dragging){
        var canvRect=canvas.getBoundingClientRect()
        var mousePagePos=[e.clientX-canvRect.left,e.clientY-canvRect.top]
        mousePos=getDiagramCoords(mousePagePos[0],mousePagePos[1])
        var posDiff=[mousePagePos[0]-lastMousePos[0],mousePagePos[1]-lastMousePos[1]]
        lastMousePos=mousePagePos
    }
    if(dragging&&clickTarget==null){
        camPos[0]-=posDiff[0]/width*scale
        camPos[1]-=posDiff[1]/width*scale
    }
})
document.addEventListener("mouseup",e=>{
    if(!dragging&&lastMousePos!=null){
        if(clickTarget!=null){
            if(selectedVertex==null){
                selectedVertex=clickTarget
                selectedEdge=null
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
                    var revEdge=false//directed edge in opposite direction
                    for(var i=0;i<curGraph.edges.length;i++){
                        var curEdge=curGraph.edges[i]
                        if(curEdge.v1==selectedVertex&&curEdge.v2==clickTarget||(!curEdge.directed&&curEdge.v2==selectedVertex&&curEdge.v1==clickTarget)){
                            canAdd=false
                            selectedEdge=i
                            break
                        }
                        if(curEdge.directed&&curEdge.v2==selectedVertex&&curEdge.v1==clickTarget){
                            revEdge=true
                        }
                    }
                    if(canAdd&&curTool=="draw"){
                        curGraph.edges.push({v1:selectedVertex,v2:clickTarget,directed:revEdge})
                        selectedEdge=curGraph.edges.length-1
                    }
                }
                selectedVertex=null
            }
        }else{
            selectedVertex=null
            selectedEdge=null
        if(curTool=="draw")curGraph.vertices.push({x:mousePos[0],y:mousePos[1]})
        }
    }
    dragging=0
    dragIndex=null
    clickTarget=null
    lastMousePos=null
    if(selectedEdge!=null){
        document.getElementById("edgeSettings").style.display="block"
        document.getElementById("edgeWeight").value=curGraph.edges[selectedEdge].weight??""
        document.getElementById("edgeColour").value=curGraph.edges[selectedEdge].colour??settings.edge.colour
        document.getElementById("edgeColDefault").checked=curGraph.edges[selectedEdge].colour==null
        document.getElementById("edgeLabel").value=curGraph.edges[selectedEdge].label??""
        document.getElementById("edgeWidth").value=curGraph.edges[selectedEdge].width??""
        document.getElementById("edgeDirected").checked=curGraph.edges[selectedEdge].directed
    }else{
        document.getElementById("edgeSettings").style.display="none"
        //document.getElementById("edgeWeight").value=""
    }
    if(selectedVertex!=null){
        document.getElementById("vertexSettings").style.display="block"
        document.getElementById("vertexLabel").value=curGraph.vertices[selectedVertex].label??""
        document.getElementById("vertexColour").value=curGraph.vertices[selectedVertex].colour??settings.vertex.colour
        document.getElementById("vertexColDefault").checked=curGraph.vertices[selectedVertex].colour==null
        //document.getElementById("vertexSize").value=curGraph.edges[selectedEdge].weight
    }else{
        document.getElementById("vertexSettings").style.display="none"
    }
    if(adjMatrixEnabled)renderMatrix()
    if(adjListEnabled)renderAdjList()
})

document.getElementById("deleteModeButton").addEventListener("click",e=>{
    if(curTool=="delete"){
        curTool="draw"
        e.target.textContent="delete"
    }else{
        curTool="delete"
        e.target.textContent="draw"
        selectedVertex=null
    }
})

function deleteSelection(){
    if(selectedEdge!=null){
        curGraph.edges.splice(selectedEdge,1)
        selectedEdge=null
    }
    else if(selectedVertex!=null){
        curGraph.vertices.splice(selectedVertex,1)
        for(var i=0;i<curGraph.edges.length;i++){
            var curEdge=curGraph.edges[i]
            if(curEdge.v1==selectedVertex||curEdge.v2==selectedVertex){
                curGraph.edges.splice(i,1)
                i--
                continue
            }
            if(curEdge.v1>selectedVertex)curEdge.v1--
            if(curEdge.v2>selectedVertex)curEdge.v2--
        }
        selectedVertex=null
    }

    if(adjMatrixEnabled)renderMatrix()
    if(adjListEnabled)renderAdjList()
}
document.getElementById("drawCanvas").addEventListener("keydown",e=>{
    if(e.key=="Backspace"){
        deleteSelection()
    }
})
document.getElementById("deleteButton").addEventListener("click",e=>{
    deleteSelection()
})

document.getElementById("runAlgorithm").addEventListener("click",e=>{
    if(selectedVertex!=null){
        var selectedAlgorithm=document.getElementById("algorithms").value
        animSteps=algorithms[selectedAlgorithm](selectedVertex)
        startAnim()
    }
})
document.getElementById("clearAnim").addEventListener("click",e=>{
    clearAnim()
})

document.getElementById("edgeWeight").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].weight=e.target.value!=""?+e.target.value:null
    }
    if(adjMatrixEnabled)renderMatrix()
    if(adjListEnabled)renderAdjList()
})
document.getElementById("vertexColour").addEventListener("input",e=>{
    if(selectedVertex!=null){
        curGraph.vertices[selectedVertex].colour=e.target.value
        document.getElementById("vertexColDefault").checked=false
    }
})

document.getElementById("vertexColDefault").addEventListener("input",e=>{
    if(selectedVertex!=null){
        if(e.target.checked==false){
            curGraph.vertices[selectedVertex].colour=settings.vertex.colour
            document.getElementById("vertexColour").value=settings.vertex.colour
        }else{
            delete curGraph.vertices[selectedVertex].colour
            document.getElementById("vertexColour").value=settings.vertex.colour
        }
    }
})

document.getElementById("vertexLabel").addEventListener("input",e=>{
    if(selectedVertex!=null){
        curGraph.vertices[selectedVertex].label=e.target.value||null
        if(curGraph.vertices[selectedVertex].label==null)delete curGraph.vertices[selectedVertex].label
    }
})
document.getElementById("edgeColour").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].colour=e.target.value
        document.getElementById("edgeColDefault").checked=false
    }
})
document.getElementById("edgeColDefault").addEventListener("input",e=>{
    if(selectedEdge!=null){
        if(e.target.checked==false){
            curGraph.edges[selectedEdge].colour=settings.edge.colour
            document.getElementById("edgeColour").value=settings.edge.colour
        }else{
            delete curGraph.edges[selectedEdge].colour
            document.getElementById("edgeColour").value=settings.edge.colour
        }
    }
})
document.getElementById("edgeWidth").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].width=e.target.value||null
        if(curGraph.edges[selectedEdge].width==null)delete curGraph.edges[selectedEdge].width
    }
})
document.getElementById("edgeLabel").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].label=e.target.value||null
        if(curGraph.edges[selectedEdge].label==null)delete curGraph.edges[selectedEdge].label
    }
})
document.getElementById("edgeDirected").addEventListener("input",e=>{
    if(selectedEdge!=null){
        var editedEdge=curGraph.edges[selectedEdge]
        for(var i=0;i<curGraph.edges.length;i++){//do not allow if there is a reverse edge
            var curEdge=curGraph.edges[i]
            if(curEdge.v2==editedEdge.v1&&curEdge.v1==editedEdge.v2){
                e.target.checked=true
                return
            }
        }
        curGraph.edges[selectedEdge].directed=e.target.checked
        if(curGraph.edges[selectedEdge].directed==false)delete curGraph.edges[selectedEdge].directed
    }
})
document.getElementById("defaultEdgeColour").addEventListener("input",e=>{
    settings.edge.colour=e.target.value
})
document.getElementById("defaultEdgeWidth").addEventListener("input",e=>{
    settings.edge.width=e.target.value
})
document.getElementById("defaultVertexColour").addEventListener("input",e=>{
    settings.vertex.colour=e.target.value
})

document.getElementById("exportPNG").addEventListener("click",e=>{
    canvas.toBlob(a=>{
        if(a==null)return
        var ourl=URL.createObjectURL(a)
        var lnk=document.createElement("a")
        lnk.download="graph"
        lnk.href=ourl
        lnk.click()
        URL.revokeObjectURL(ourl)
    })
})
document.getElementById("exportSVG").addEventListener("click",e=>{
    renderGraphSVG()
})
function getCode(){
    console.log(JSON.stringify({settings:settings,graph:curGraph}))
}
[...document.getElementById("tabMenu").children].map((a,b)=>{
    a.onclick=a=>{
        [...document.getElementById("tabs").children].slice(1).forEach(b=>{
            b.style.display="none"
        });
        [...document.getElementById("tabs").children][b+1].style.display="block"
    }
})
curGraph.vertices.push({x:0,y:0})
updateGraph()
