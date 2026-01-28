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
        outlineWidth:2,
        colour:"#aaaaaa"
    },
    edge:{
        labelSize:15,
        labelColour:"#000000",
        colour:"#000000",
        width:2,
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
    var edgeDistances={}
    var edgeDists=[]
    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        adjList[curEdge.v1+" "+curEdge.v2]||=0
        adjList[curEdge.v1+" "+curEdge.v2]++
    }

    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        edgeDistances[curEdge.v1+" "+curEdge.v2]||=0
        edgeDistances[curEdge.v1+" "+curEdge.v2]++

        if((adjList[curEdge.v1+" "+curEdge.v2]??0)+(adjList[curEdge.v2+" "+curEdge.v1]??0)>1)edgeDists.push(edgeDistances[curEdge.v1+" "+curEdge.v2])
        else if(curEdge.v1==curEdge.v2)edgeDists.push(edgeDistances[curEdge.v1+" "+curEdge.v2])
        else edgeDists.push(0)
    }
    for(var i=0;i<curGraph.edges.length;i++){
        var curStyle=getStyle(settings.edge,curGraph.edges[i],curGraph.edges[i].style)
        rc.lineWidth=curStyle.width*dpr*(1+(i==selectedEdge))
        rc.strokeStyle=curStyle.colour
        if(curStyle.dash)rc.setLineDash(curStyle.dash.map(a=>a*curStyle.width*dpr*(1+(i==selectedEdge))))
        rc.beginPath()
        var ev1=curGraph.vertices[curGraph.edges[i].v1]
        var ev2=curGraph.vertices[curGraph.edges[i].v2]
        //rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        if(curGraph.edges[i].v1==curGraph.edges[i].v2){
            var loopRad=edgeDists[i]*0.05
            rc.arc(...getCanvCoords(ev1.x,ev1.y-loopRad,dpr),loopRad*width/scale*dpr,Math.PI/2,2.5*Math.PI)
        }else{
            var edgeOffset=settings.directedEdgeDist*(edgeDists[i]?edgeDists[i]*2-1:0)
            if(edgeOffset!=0){
                var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
                if(settings.curvedEdges){
                    rc.moveTo(...getCanvCoords(ev1.x,ev1.y,dpr))
                    rc.quadraticCurveTo(...getCanvCoords((ev1.x+ev2.x)/2+(ev2.y-ev1.y)/ev1ev2d*edgeOffset*2,(ev1.y+ev2.y)/2-(ev2.x-ev1.x)/ev1ev2d*edgeOffset*2,dpr),...getCanvCoords(ev2.x,ev2.y,dpr))
                }else{
                    rc.moveTo(...getCanvCoords(ev1.x+(ev2.y-ev1.y)/ev1ev2d*edgeOffset,ev1.y-(ev2.x-ev1.x)/ev1ev2d*edgeOffset,dpr))
                    rc.lineTo(...getCanvCoords(ev2.x+(ev2.y-ev1.y)/ev1ev2d*edgeOffset,ev2.y-(ev2.x-ev1.x)/ev1ev2d*edgeOffset,dpr))
                }
            }else{
                rc.moveTo(...getCanvCoords(ev1.x,ev1.y,dpr))
                rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
            }
        }
        rc.stroke()

        rc.setLineDash([])
        if(curGraph.edges[i].directed){//draw arrow
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            var ev1ev2rat=0.5
            var arrSizeX=scale*0.02
            var arrSizeY=scale*0.007
            rc.beginPath()
            var edgeDir=[(ev2.x-ev1.x)/ev1ev2d,(ev2.y-ev1.y)/ev1ev2d]
            var arrPos=[ev1.x+(ev2.x-ev1.x)/2,ev1.y+(ev2.y-ev1.y)/2]
            if(curGraph.edges[i].v1==curGraph.edges[i].v2){
                edgeDir=[1,0]
                arrPos=[ev1.x,ev1.y-edgeDists[i]*0.1]
                edgeOffset=0
            }
            rc.moveTo(...getCanvCoords(arrPos[0]+(edgeDir[0]*(-arrSizeX/2)-edgeDir[1]*(arrSizeY-edgeOffset)),arrPos[1]+(edgeDir[1]*(-arrSizeX/2)+edgeDir[0]*(arrSizeY-edgeOffset)),dpr))//back right
            rc.lineTo(...getCanvCoords(arrPos[0]+(edgeDir[0]*(-arrSizeX/2)-edgeDir[1]*(-arrSizeY-edgeOffset)),arrPos[1]+(edgeDir[1]*(-arrSizeX/2)+edgeDir[0]*(-arrSizeY-edgeOffset)),dpr))//back left
            rc.lineTo(...getCanvCoords(arrPos[0]+(edgeDir[0]*(arrSizeX/2)-edgeDir[1]*(-edgeOffset)),arrPos[1]+(edgeDir[1]*(arrSizeX/2)+edgeDir[0]*(-edgeOffset)),dpr))//forward
            rc.closePath()
            rc.fill()
        }
        if(curStyle.labelSize){
            rc.fillStyle=curStyle.labelColour
            rc.font=curStyle.labelSize*dpr+"px sans-serif"
            rc.textAlign="center"
            rc.textBaseline="middle"
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            var edgeDir=[(ev2.x-ev1.x)/ev1ev2d,(ev2.y-ev1.y)/ev1ev2d]
            if(curGraph.edges[i].v1==curGraph.edges[i].v2){
                edgeDir=[1,0]
                edgeOffset=edgeDists[i]*0.1
            }
            var label=curStyle.label??curGraph.edges[i].weight
            if(label!=null)rc.fillText(label,...getCanvCoords((ev1.x+ev2.x)/2+edgeDir[1]*(curStyle.labelDistance/width*scale+edgeOffset),(ev1.y+ev2.y)/2-edgeDir[0]*(curStyle.labelDistance/width*scale+edgeOffset),dpr))
        }
    }
    for(var i=0;i<curGraph.vertices.length;i++){
        var cvert=curGraph.vertices[i]
        var curStyle=getStyle(settings.vertex,cvert,cvert.style)
        rc.strokeStyle=curStyle.outlineCol
        rc.lineWidth=curStyle.outlineWidth*dpr*(1+(i==selectedVertex))
        rc.fillStyle=curStyle.colour
        if(curStyle.size){
            rc.beginPath()
            rc.arc(...getCanvCoords(cvert.x,cvert.y,dpr),curStyle.size*dpr,0,7,0)
            rc.fill()
            rc.stroke()
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
function renderReps(){
    renderAdjList()
    renderMatrix()
}
function renderMatrix(){
    if(!adjMatrixEnabled)return
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
    if(!adjListEnabled)return
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
    var edgeDistances={}
    var edgeDists=[]
    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        adjList[curEdge.v1+" "+curEdge.v2]||=0
        adjList[curEdge.v1+" "+curEdge.v2]++
    }

    for(var i=0;i<curGraph.edges.length;i++){
        var curEdge=curGraph.edges[i]
        edgeDistances[curEdge.v1+" "+curEdge.v2]||=0
        edgeDistances[curEdge.v1+" "+curEdge.v2]++

        if((adjList[curEdge.v1+" "+curEdge.v2]??0)+(adjList[curEdge.v2+" "+curEdge.v1]??0)>1)edgeDists.push(edgeDistances[curEdge.v1+" "+curEdge.v2])
        else if(curEdge.v1==curEdge.v2)edgeDists.push(edgeDistances[curEdge.v1+" "+curEdge.v2])
        else edgeDists.push(0)
    }
    for(var i=0;i<curGraph.edges.length;i++){
        var curStyle=getStyle(settings.edge,curGraph.edges[i],curGraph.edges[i].style)

        var ev1=curGraph.vertices[curGraph.edges[i].v1]
        var ev2=curGraph.vertices[curGraph.edges[i].v2]
        //rc.lineTo(...getCanvCoords(ev2.x,ev2.y,dpr))
        if(curGraph.edges[i].v1==curGraph.edges[i].v2){
            var pel=document.createElementNS("http://www.w3.org/2000/svg","circle")
            pel.style.strokeWidth=curStyle.width/width*scale
            pel.style.stroke=curStyle.colour
            pel.style.cx=ev1.x
            pel.style.cy=ev1.y-0.05
            pel.style.r=0.05
            pel.setAttribute("fill","none")
            svel.append(pel)
        }else{
            var pel=document.createElementNS("http://www.w3.org/2000/svg","path")
            pel.style.strokeWidth=curStyle.width/width*scale
            pel.style.stroke=curStyle.colour
            var peld=""
            var edgeOffset=settings.directedEdgeDist*edgeDists[i]
            if(edgeOffset!=0){
                var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
                if(settings.curvedEdges){
                    peld+="M"+[ev1.x,ev1.y]
                    peld+="Q"+[(ev1.x+ev2.x)/2+(ev2.y-ev1.y)/ev1ev2d*edgeOffset*2,(ev1.y+ev2.y)/2-(ev2.x-ev1.x)/ev1ev2d*edgeOffset*2]+","+[ev2.x,ev2.y]
                }else{
                    peld+="M"+[ev1.x+(ev2.y-ev1.y)/ev1ev2d*edgeOffset,ev1.y-(ev2.x-ev1.x)/ev1ev2d*edgeOffset]
                    peld+="L"+[ev2.x+(ev2.y-ev1.y)/ev1ev2d*edgeOffset,ev2.y-(ev2.x-ev1.x)/ev1ev2d*edgeOffset]
                }
            }else{
                peld+="M"+[ev1.x,ev1.y]
                peld+="L"+[ev2.x,ev2.y]
            }
            pel.setAttribute("d",peld)
            pel.setAttribute("fill","none")
            svel.append(pel)
        }
        if(curGraph.edges[i].directed){//draw arrow
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            var ev1ev2rat=0.5
            var arrSizeX=scale*0.02
            var arrSizeY=scale*0.007
            var pel=document.createElementNS("http://www.w3.org/2000/svg","path")
            var peld=""
            var edgeDir=[(ev2.x-ev1.x)/ev1ev2d,(ev2.y-ev1.y)/ev1ev2d]
            var arrPos=[ev1.x+(ev2.x-ev1.x)/2,ev1.y+(ev2.y-ev1.y)/2]
            if(curGraph.edges[i].v1==curGraph.edges[i].v2){
                edgeDir=[1,0]
                arrPos=[ev1.x,ev1.y-edgeDists[i]*0.1]
                edgeOffset=0
            }
            peld+="M"+[arrPos[0]+(edgeDir[0]*(-arrSizeX/2)-edgeDir[1]*(arrSizeY-edgeOffset)),arrPos[1]+(edgeDir[1]*(-arrSizeX/2)+edgeDir[0]*(arrSizeY-edgeOffset))]//back right
            peld+="L"+[arrPos[0]+(edgeDir[0]*(-arrSizeX/2)-edgeDir[1]*(-arrSizeY-edgeOffset)),arrPos[1]+(edgeDir[1]*(-arrSizeX/2)+edgeDir[0]*(-arrSizeY-edgeOffset))]//back left
            peld+="L"+[arrPos[0]+(edgeDir[0]*(arrSizeX/2)-edgeDir[1]*(-edgeOffset)),arrPos[1]+(edgeDir[1]*(arrSizeX/2)+edgeDir[0]*(-edgeOffset))]//forward
            peld+="Z"
            pel.setAttribute("d",peld)
            svel.append(pel)
        }
        if(curStyle.labelSize){
            rc.fillStyle=curStyle.labelColour
            var ev1ev2d=Math.hypot(ev1.x-ev2.x,ev1.y-ev2.y)
            var edgeDir=[(ev2.x-ev1.x)/ev1ev2d,(ev2.y-ev1.y)/ev1ev2d]
            if(curGraph.edges[i].v1==curGraph.edges[i].v2){
                edgeDir=[1,0]
                edgeOffset=edgeDists[i]*0.1
            }
            var label=curStyle.label??curGraph.edges[i].weight

            if(label!=null){
                var pel=document.createElementNS("http://www.w3.org/2000/svg","text")
                pel.setAttribute("x",(ev1.x+ev2.x)/2+edgeDir[1]*(curStyle.labelDistance/width*scale+edgeOffset))
                pel.setAttribute("y",(ev1.y+ev2.y)/2-edgeDir[0]*(curStyle.labelDistance/width*scale+edgeOffset))
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
        rc.lineWidth=curStyle.outlineWidth*dpr*(1+(i==selectedVertex))
        rc.fillStyle=curStyle.colour
        if(curStyle.size){
            var pel=document.createElementNS("http://www.w3.org/2000/svg","circle")
            pel.setAttribute("cx",cvert.x)
            pel.setAttribute("cy",cvert.y)
            pel.setAttribute("r",curStyle.size/width*scale)
            pel.setAttribute("fill",curStyle.colour)
            pel.setAttribute("stroke",curStyle.outlineCol)
            pel.setAttribute("stroke-width",curStyle.outlineWidth/width*scale)
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
    if(dragging)updateGraph()
})
document.addEventListener("mouseup",e=>{
    var changedGraph=false
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
                    changedGraph=true
                }else if(curTool=="algorithm"&&curAlgParamTypes[curAlgParams.length].type=="vertex"){
                    curAlgParams.push(clickTarget)
                    selectedVertex=null
                    algEnterParam()
                }
            }else{
                if(selectedVertex!=clickTarget||e.shiftKey||e.metaKey){
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
                    canAdd||=e.shiftKey
                    if(canAdd&&curTool=="draw"){
                        curGraph.edges.push({v1:selectedVertex,v2:clickTarget,directed:revEdge})
                        selectedEdge=curGraph.edges.length-1
                        changedGraph=true
                    }else if(!canAdd&&curTool=="algorithm"&&curAlgParamTypes[curAlgParams.length].type=="edge"){
                        curAlgParams.push(selectedEdge)
                        selectedEdge=null
                        algEnterParam()
                    }
                }
                selectedVertex=null
            }
        }else{
            selectedVertex=null
            selectedEdge=null
            if(curTool=="draw"){
                curGraph.vertices.push({x:mousePos[0],y:mousePos[1]})
                changedGraph=true
            }
        }
    }else if(dragging&&clickTarget!=null){
        pushUndo()
    }

    if(lastMousePos!=null)updateGraph()
    dragging=0
    dragIndex=null
    clickTarget=null
    lastMousePos=null
    updateUI()
    //vertices might have changed
    if(changedGraph){
        pushUndo()
        renderReps()
    }
})
function updateUI(){
    if(selectedEdge!=null){
        document.getElementById("edgeSettings").style.display="block"
        document.getElementById("edgeWeight").value=curGraph.edges[selectedEdge].weight??""
        document.getElementById("edgeColour").value=curGraph.edges[selectedEdge].colour??settings.edge.colour
        document.getElementById("edgeColDefault").checked=curGraph.edges[selectedEdge].colour==null
        document.getElementById("edgeLabel").value=curGraph.edges[selectedEdge].label??""
        document.getElementById("edgeWidth").value=curGraph.edges[selectedEdge].width??""
        document.getElementById("edgeDash").value=(curGraph.edges[selectedEdge].dash?.join(",")??"default")||"0"
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
        document.getElementById("vertexOutlineWidth").value=curGraph.vertices[selectedVertex].outlineWidth??""
        document.getElementById("vertexOutlineCol").value=curGraph.vertices[selectedVertex].outlineCol??settings.vertex.outlineCol
        document.getElementById("vertexOutlineColDefault").checked=curGraph.vertices[selectedVertex].outlineCol==null
        //document.getElementById("vertexSize").value=curGraph.edges[selectedEdge].weight
    }else{
        document.getElementById("vertexSettings").style.display="none"
    }
}
function cycleEdges(){
    var curEdgeAdj=curGraph.edges[selectedEdge].v1+" "+curGraph.edges[selectedEdge].v2
    for(var i=1;i<=curGraph.edges.length;i++){
        var curInd=(selectedEdge+i)%curGraph.edges.length
        if(curGraph.edges[curInd].v1+" "+curGraph.edges[curInd].v2==curEdgeAdj||curGraph.edges[curInd].v2+" "+curGraph.edges[curInd].v1==curEdgeAdj){
            selectedEdge=curInd
            updateGraph()
            updateUI()
            return
        }
    }
}

document.getElementById("drawModeButton").addEventListener("click",e=>{
    document.getElementById("deleteModeButton").classList.remove("selected")
    document.getElementById("drawModeButton").classList.add("selected")
    curTool="draw"
})
document.getElementById("deleteModeButton").addEventListener("click",e=>{
    document.getElementById("drawModeButton").classList.remove("selected")
    document.getElementById("deleteModeButton").classList.add("selected")
    curTool="delete"
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

    renderReps()
    updateGraph()
}
var undoInd=-1
var undoStack=[]
function pushUndo(){
    undoStack.length=undoInd+1
    undoInd=undoStack.length
    var newGraph=JSON.stringify({...curGraph,settings:settings})
    undoStack.push(newGraph)
}
document.getElementById("drawCanvas").addEventListener("keydown",e=>{
    if(e.key=="Backspace"){
        deleteSelection()
        updateGraph()
        pushUndo()
    }else if(e.code=="KeyZ"&&e.metaKey&&e.shiftKey){
        if(undoInd<undoStack.length-1){
            undoInd++
            curGraph=JSON.parse(undoStack[undoInd])
            settings=curGraph.settings
            updateGraph()
        }
        renderReps()
        selectedVertex=null
        selectedEdge=null
        e.preventDefault()
    }else if(e.code=="KeyZ"&&e.metaKey&&!e.shiftKey){
        if(undoInd==undoStack.length-1){//make sure latest version of graph is on the stack
            var newGraph=JSON.stringify({...curGraph,settings:settings})
            undoStack[undoStack.length-1]=newGraph
        }
        if(undoInd){
            undoInd--
            curGraph=JSON.parse(undoStack[undoInd])
            settings=curGraph.settings
            updateGraph()
        }
        renderReps()
        selectedVertex=null
        selectedEdge=null
        e.preventDefault()
    }else if(e.code=="KeyD"){
        curGraph.edges[selectedEdge].directed=!curGraph.edges[selectedEdge].directed
        renderReps()
        pushUndo()
        updateGraph()
        return 999999999999999999-1e18
    }else if(e.code=="KeyC"){
        cycleEdges()
    }
})
document.getElementById("deleteButton").addEventListener("click",e=>{
    deleteSelection()
})
var selectedAlgorithm=null
var curAlgParams=[]
var curAlgParamTypes=[]
function runAlgorithm(alg,params){
    animSteps=algorithms[alg].run(...params)
    startAnim()
    curTool="draw"
}
function algEnterParam(){//requests parameter or runs algorithm
    if(curAlgParamTypes.length==curAlgParams.length){
        runAlgorithm(selectedAlgorithm,curAlgParams)
    }else{
        var dvEl=document.createElement("div")
        dvEl.append("Select "+algorithms[selectedAlgorithm].parameters[curAlgParams.length].name)
        document.getElementById("algOutput").append(dvEl)
    }
}
document.getElementById("runAlgorithm").addEventListener("click",e=>{
    selectedAlgorithm=document.getElementById("algorithms").value
    curTool="algorithm"
    curAlgParams=[]
    curAlgParamTypes=algorithms[selectedAlgorithm].parameters
    document.getElementById("algOutput").textContent=""
    algEnterParam()
})
document.getElementById("clearAnim").addEventListener("click",e=>{
    clearAnim()
})

document.getElementById("edgeWeight").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].weight=e.target.value!=""?+e.target.value:null
    }
    pushUndo()
    renderReps()
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
        updateGraph()
    }
})
document.getElementById("vertexOutlineWidth").addEventListener("input",e=>{
    if(selectedVertex!=null){
        curGraph.vertices[selectedVertex].outlineWidth=e.target.value||null
        if(curGraph.vertices[selectedVertex].outlineWidth==null)delete curGraph.vertices[selectedVertex].outlineWidth
        updateGraph()
    }
})
document.getElementById("vertexOutlineCol").addEventListener("input",e=>{
    if(selectedVertex!=null){
        curGraph.vertices[selectedVertex].outlineCol=e.target.value||null
        if(curGraph.vertices[selectedVertex].outlineCol==null)delete curGraph.vertices[selectedVertex].outlineCol
        updateGraph()
    }
})
document.getElementById("vertexOutlineColDefault").addEventListener("input",e=>{
    if(selectedVertex!=null){
        if(e.target.checked==false){
            curGraph.vertices[selectedVertex].outlineCol=settings.vertex.outlineCol
            document.getElementById("vertexOutlineCol").value=settings.vertex.outlineCol
        }else{
            delete curGraph.vertices[selectedVertex].outlineCol
            document.getElementById("vertexOutlineCol").value=settings.vertex.outlineCol
        }
        updateGraph()
    }
})
document.getElementById("edgeColour").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].colour=e.target.value
        document.getElementById("edgeColDefault").checked=false
        updateGraph()
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
        updateGraph()
    }
})
document.getElementById("edgeDash").addEventListener("input",e=>{
    if(selectedEdge!=null){
        if(e.target.value!="default")curGraph.edges[selectedEdge].dash=e.target.value=="0"?[]:e.target.value.split(",").map(a=>+a)
        else delete curGraph.edges[selectedEdge].dash
        updateGraph()
    }
})
document.getElementById("edgeWidth").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].width=e.target.value||null
        if(curGraph.edges[selectedEdge].width==null)delete curGraph.edges[selectedEdge].width
        updateGraph()
    }
})
document.getElementById("edgeLabel").addEventListener("input",e=>{
    if(selectedEdge!=null){
        curGraph.edges[selectedEdge].label=e.target.value||null
        if(curGraph.edges[selectedEdge].label==null)delete curGraph.edges[selectedEdge].label
        updateGraph()
    }
})
document.getElementById("edgeDirected").addEventListener("input",e=>{
    if(selectedEdge!=null){
        /*
        var editedEdge=curGraph.edges[selectedEdge]
        for(var i=0;i<curGraph.edges.length;i++){//do not allow if there is a reverse edge
            var curEdge=curGraph.edges[i]
            if(curEdge.v2==editedEdge.v1&&curEdge.v1==editedEdge.v2){
                e.target.checked=true
                return
            }
        }
        */
        curGraph.edges[selectedEdge].directed=e.target.checked
        if(curGraph.edges[selectedEdge].directed==false)delete curGraph.edges[selectedEdge].directed
        updateGraph()
    }
})
document.getElementById("defaultEdgeColour").addEventListener("input",e=>{
    settings.edge.colour=e.target.value
    updateGraph()
})
document.getElementById("defaultEdgeWidth").addEventListener("input",e=>{
    settings.edge.width=e.target.value
    updateGraph()
})
document.getElementById("defaultEdgeDash").addEventListener("input",e=>{
    settings.edge.dash=e.target.value=="0"?[]:e.target.value.split(",").map(a=>+a)
    updateGraph()
})
document.getElementById("defaultVertexColour").addEventListener("input",e=>{
    settings.vertex.colour=e.target.value
    updateGraph()
})
document.getElementById("defaultVertexOutlineCol").addEventListener("input",e=>{
    settings.vertex.outlineCol=e.target.value
    updateGraph()
})
document.getElementById("defaultVertexOutlineWidth").addEventListener("input",e=>{
    settings.vertex.outlineWidth=e.target.value
    updateGraph()
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
document.getElementById("adjMatrixExpander").firstChild.addEventListener("click",e=>{
    if(!adjMatrixEnabled){
        adjMatrixEnabled=1
        document.getElementById("adjMatrixExpander").classList.add("expanded")
        renderMatrix()
    }else{
        adjMatrixEnabled=0
        document.getElementById("adjMatrixExpander").classList.remove("expanded")
        document.getElementById("adjMatrix").textContent=""
    }
})
document.getElementById("adjListExpander").firstChild.addEventListener("click",e=>{
    if(!adjListEnabled){
        adjListEnabled=1
        document.getElementById("adjListExpander").classList.add("expanded")
        renderAdjList()
    }else{
        adjListEnabled=0
        document.getElementById("adjListExpander").classList.remove("expanded")
        document.getElementById("adjList").textContent=""
    }
})
function getCode(){
    return JSON.stringify({...curGraph,settings:settings})
}
function importGraph(code){
    var obj=JSON.parse(code)
    settings=Object.assign(settings,obj.settings)
    curGraph=obj
    pushUndo()
    renderReps()
    updateGraph()
}
[...document.getElementById("tabMenu").children].map((a,b)=>{
    a.onclick=a=>{
        [...document.getElementById("tabs").children].slice(1).forEach(b=>{
            b.style.display="none"
        });
        [...document.getElementById("tabs").children][b+1].style.display="block"
    }
})

window.addEventListener("beforeunload",e=>{e.preventDefault;return true})

document.getElementById("randomiseWeights").addEventListener("click",e=>{
    var minw=+document.getElementById("edgeWeightMin").value??1
    var maxw=+document.getElementById("edgeWeightMax").value??100
    var wstep=+document.getElementById("edgeWeightStep").value||1
    for(var i=0;i<curGraph.edges.length;i++){
        curGraph.edges[i].weight=Math.floor(Math.random()*(maxw-minw+1)/wstep)*wstep+minw
    }
    pushUndo()
    renderReps()
    updateGraph()
})

document.getElementById("reverseEdges").addEventListener("click",e=>{
    for(var i=0;i<curGraph.edges.length;i++){
        [curGraph.edges[i].v1,curGraph.edges[i].v2]=[curGraph.edges[i].v2,curGraph.edges[i].v1]
    }
    pushUndo()
    renderReps()
    updateGraph()
})
curGraph.vertices.push({x:0,y:0})
updateGraph()
pushUndo()
