var styles={
    dijkstra:{
        considered:{colour:"#aaa",width:1},
        tree:{colour:"green",width:3},
        path:{colour:"blue",width:3}
    },
    prim:{
        unused:{colour:"#aaa",width:1},
        used:{colour:"green",width:3},
        considered:{colour:"red"}
    },
    kruskal:{
        considered:{colour:"red"},
        unused:{colour:"#aaa",width:1},
        used:{colour:"green",width:3}
    }
}
function getVertexLabel(vert){
    return (curGraph.vertices[vert].label??vert)
}
var algorithms={
    dijkstra(vert,dest){
        var pq=new Heap((a,b)=>a[1]<b[1])
        var steps=[]
        var dists=curGraph.vertices.map(a=>-1)
        var last=curGraph.vertices.map(a=>-1)//the edge
        var adj=curGraph.vertices.map(a=>[])
        for(var i=0;i<curGraph.edges.length;i++){
            adj[curGraph.edges[i].v1].push(i)
            if(!curGraph.edges[i].directed)adj[curGraph.edges[i].v2].push(i)
        }
        pq.push([vert,0,-1])
        while(pq.length){
            var cur=pq.pop()
            if(dists[cur[0]]!=-1)continue
            var curStep=[]
            steps.push([{type:"output",text:"Vertex "+getVertexLabel(cur[0])+" (weight "+cur[1]+"):"}])
            if(cur[2]!=-1)steps[steps.length-1].push({type:"edge",index:cur[2],style:styles.dijkstra.tree})//shortest path tree
            last[cur[0]]=cur[2]
            dists[cur[0]]=cur[1]
            steps.push([{type:"vertex",index:cur[0],style:{colour:"red"}}])
            for(var i=0;i<adj[cur[0]].length;i++){
                var eind=adj[cur[0]][i]
                var cedge=curGraph.edges[eind]
                if(cedge.v1==cur[0]&&dists[cedge.v2]==-1){
                    steps.push([{type:"output",text:"Vertex "+getVertexLabel(cedge.v2)+" reached with weight "+(cur[1]+(cedge.weight??1))},{type:"edge",index:eind,style:styles.dijkstra.considered}])
                    pq.push([cedge.v2,cur[1]+(cedge.weight??1),eind])
                    //await new Promise(a=>setTimeout(a,400))
                }else if(!cedge.directed&&cedge.v2==cur[0]&&dists[cedge.v1]==-1){
                    steps.push([{type:"output",text:"Vertex "+getVertexLabel(cedge.v1)+" reached with weight "+(cur[1]+(cedge.weight??1))},{type:"edge",index:eind,style:styles.dijkstra.considered}])
                    pq.push([cedge.v1,cur[1]+(cedge.weight??1),eind])
                    //await new Promise(a=>setTimeout(a,400))
                }
            }
        }
        if(dest==null)return steps
        if(dists[dest]==-1){
            steps.push([{type:"output",text:"Vertex "+getVertexLabel(dest)+" unreachable"}])
            return steps
        }
        steps.push([{type:"output",text:"Vertex "+getVertexLabel(dest)+" shortest path length "+dists[dest]}])

        while(dest!=vert){
            steps.push([{type:"edge",index:last[dest],style:styles.dijkstra.path}])
            dest=dest^curGraph.edges[last[dest]].v1^curGraph.edges[last[dest]].v2
            //await new Promise(a=>setTimeout(a,400))
        }
        console.log(dists)
        return steps
    },
    prim(vert){
        var pq=new Heap((a,b)=>a[1]<b[1])
        var steps=[]
        var visited=curGraph.vertices.map(a=>false)
        pq.push([vert,0,-1])
        var clast=0
        var adj=curGraph.vertices.map(a=>[])
        for(var i=0;i<curGraph.edges.length;i++){
            adj[curGraph.edges[i].v1].push(i)
            adj[curGraph.edges[i].v2].push(i)
        }
        while(pq.length){
            //pq.sort((a,b)=>a[1]-b[1])//not needed if priority queue
            var cur=pq.pop()
            if(visited[cur[0]]){
                if(cur[2]!=-1)steps.push([{type:"edge",index:cur[2],style:styles.prim.unused}])
                continue
            }
            visited[cur[0]]=true
            if(cur[2]!=-1){
                var prevVertex=cur[0]^curGraph.edges[cur[2]].v1^curGraph.edges[cur[2]].v2
                steps.push([{type:"output",text:"Adding vertex "+getVertexLabel(cur[0])+" (weight "+cur[1]+"from vertex "+getVertexLabel(prevVertex)+")"},{type:"edge",index:cur[2],style:styles.prim.used}])
            }
            clast=cur[0]
            steps.push([{type:"vertex",index:cur[0],style:{colour:"red"}}])
            for(var i=0;i<adj[cur[0]].length;i++){
                var eind=adj[cur[0]][i]
                var cedge=curGraph.edges[eind]
                if(cedge.v1==cur[0]&&!visited[cedge.v2]){
                    steps.push([{type:"edge",index:eind,style:styles.prim.considered}])
                    pq.push([cedge.v2,(cedge.weight??1),eind])
                    //await new Promise(a=>setTimeout(a,400))
                }else if(cedge.v2==cur[0]&&!visited[cedge.v1]){
                    steps.push([{type:"edge",index:eind,style:styles.prim.considered}])
                    pq.push([cedge.v1,(cedge.weight??1),eind])
                    //await new Promise(a=>setTimeout(a,400))
                }
            }
        }
        return steps
    },
    kruskal(){
        var parents=curGraph.vertices.map(a=>-1)
        function find(a){
            if(parents[a]==-1)return a
            parents[a]=find(parents[a])
            return parents[a]
        }
        function merge(a,b){
            a=find(a),b=find(b)
            if(a==b)return false
            parents[b]=a
            return true
        }
        var steps=[]
        var eorder=curGraph.edges.map((a,b)=>b)
        eorder.sort((a,b)=>(curGraph.edges[a].weight??1)-(curGraph.edges[b].weight??1))
        for(var i=0;i<curGraph.edges.length;i++){
            var eind=eorder[i]
            var curEdge=curGraph.edges[eind]
            steps.push([{type:"edge",index:eind,style:styles.kruskal.considered}])
            if(merge(curEdge.v1,curEdge.v2)){
                steps.push([{type:"edge",index:eind,style:styles.kruskal.used}])
            }else{
                steps.push([{type:"edge",index:eind,style:styles.kruskal.unused}])
            }
        }
        return steps
    }
}
