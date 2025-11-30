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
    },
    nn:{
        path:{colour:"blue",width:3}
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
                steps.push([{type:"output",text:"Adding vertex "+getVertexLabel(cur[0])+" (weight "+cur[1]+" from vertex "+getVertexLabel(prevVertex)+")"},{type:"edge",index:cur[2],style:styles.prim.used}])
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
    },
    nn(vert){//Nearest neighbour algorithm
        var distmat=[]
        var steps=[]
        var adj=curGraph.vertices.map(a=>[])
        for(var i=0;i<curGraph.edges.length;i++){
            adj[curGraph.edges[i].v1].push(i)
            if(!curGraph.edges[i].directed)adj[curGraph.edges[i].v2].push(i)
        }
        for(var vi=0;vi<curGraph.vertices.length;vi++){
            var dists=curGraph.vertices.map(a=>[-1,-1])
            var pq=new Heap((a,b)=>a[1]<b[1])
            pq.push([vi,0])
            while(pq.length){
                var cur=pq.pop()
                if(dists[cur[0]][0]!=-1)continue
                dists[cur[0]]=[cur[1],cur[2]]
                for(var i=0;i<adj[cur[0]].length;i++){
                    var eind=adj[cur[0]][i]
                    var cedge=curGraph.edges[eind]
                    if(cedge.v1==cur[0]&&dists[cedge.v2][0]==-1){
                        pq.push([cedge.v2,cur[1]+(cedge.weight??1),eind])
                        //await new Promise(a=>setTimeout(a,400))
                    }else if(!cedge.directed&&cedge.v2==cur[0]&&dists[cedge.v1][0]==-1){
                        pq.push([cedge.v1,cur[1]+(cedge.weight??1),eind])
                        //await new Promise(a=>setTimeout(a,400))
                    }
                }
            }
            distmat.push(dists)
        }
        var visited=curGraph.vertices.map(a=>0)
        var cvert=vert
        var wei=0
        var cpath=[[vert,-1]]
        for(var a=0;a<1e3;a++){
            var best=-1,bv=-1//best vertex
            visited[cvert]=1
            for(var i=0;i<curGraph.vertices.length;i++){
                if(visited[i])continue
                if((bv==-1||distmat[cvert][i][0]<best)&&distmat[cvert][i][0]!=-1){
                    best=distmat[cvert][i][0]
                    bv=i
                }
            }
            if(bv!=-1)steps.push([{type:"output",text:"Nearest unvisited neighbour of "+getVertexLabel(cvert)+" is "+getVertexLabel(bv)+" (distance "+best+")"}])
            else{
                bv=vert
                if(distmat[cvert][vert][1]==-1){
                    steps.push([{type:"output",text:"Cannot return to starting point"}])
                    return steps
                }else{
                    steps.push([{type:"output",text:"Return to starting point (weight "+distmat[cvert][vert][0]+")"}])
                }
            }

            var cps=[]
            var cpv=bv
            wei+=distmat[cvert][bv][0]
            while(cpv!=cvert){
                var curEdgeInd=distmat[cvert][cpv][1]
                cps.push([cpv,curEdgeInd])
                var nv=cpv^curGraph.edges[curEdgeInd].v1^curGraph.edges[curEdgeInd].v2
                cpv=nv
            }
            cps.reverse()
            for(var j=0;j<cps.length;j++){
                steps.push([{type:"edge",index:cps[j][1],style:styles.nn.path}])
            }
            cpath.push(...cps)
            cvert=bv
            if(bv==vert)break
        }
        steps.push([{type:"output",text:"Full path: "+cpath.map(a=>getVertexLabel(a[0])).join(", ")+" (total weight "+wei+")"}])

        return steps
    },
    cpa(){//assumes all edges are directed
        var adj=curGraph.vertices.map(a=>[])
        var radj=curGraph.vertices.map(a=>[])
        var indegs=curGraph.vertices.map(a=>0)
        var outdegs=curGraph.vertices.map(a=>0)
        var ets=curGraph.vertices.map(a=>-Infinity)
        var lts=curGraph.vertices.map(a=>Infinity)
        for(var i=0;i<curGraph.edges.length;i++){
            adj[curGraph.edges[i].v1].push([curGraph.edges[i].v2,i])
            radj[curGraph.edges[i].v2].push([curGraph.edges[i].v1,i])
            indegs[curGraph.edges[i].v2]++
            outdegs[curGraph.edges[i].v1]++
        }
        var steps=[]
        var dfs_st=[]
        for(var i=0;i<curGraph.vertices.length;i++){
            if(indegs[i]==0){
                dfs_st.push(i)
                ets[i]=0
            }
        }
        steps.push([{type:"output",text:"Forward pass"}])
        while(dfs_st.length){
            var cur=dfs_st.pop()
            for(var i=0;i<radj[cur].length;i++){
                steps.push([{type:"output",text:`${ets[radj[cur][i][0]]} + ${curGraph.edges[radj[cur][i][1]].weight} = ${ets[radj[cur][i][0]]+curGraph.edges[radj[cur][i][1]].weight}`},{type:"edge",index:radj[cur][i][1],style:{colour:"#0a0"}}])
            }
            steps.push([{type:"output",text:"Vertex "+getVertexLabel(cur)+" early time = "+ets[cur]},{type:"vertex",index:cur,style:{colour:"red"}}])

            for(var i=0;i<adj[cur].length;i++){
                var nxt=adj[cur][i]
                indegs[nxt[0]]--
                ets[nxt[0]]=Math.max(ets[nxt[0]],ets[cur]+(curGraph.edges[nxt[1]].weight??0))
                if(indegs[nxt[0]]==0){
                    dfs_st.push(nxt[0])
                }
            }
        }
        steps.push([{type:"output",text:"Backward pass"}])
        for(var i=0;i<curGraph.vertices.length;i++){
            if(outdegs[i]==0){
                dfs_st.push(i)
                lts[i]=ets[i]
            }
        }
        while(dfs_st.length){
            var cur=dfs_st.pop()
            for(var i=0;i<adj[cur].length;i++){
                steps.push([{type:"output",text:`${lts[adj[cur][i][0]]} - ${curGraph.edges[adj[cur][i][1]].weight} = ${lts[adj[cur][i][0]]-curGraph.edges[adj[cur][i][1]].weight}`},{type:"edge",index:adj[cur][i][1],style:{colour:"#00a"}}])
            }
            steps.push([{type:"output",text:"Vertex "+getVertexLabel(cur)+" late time = "+lts[cur]},{type:"vertex",index:cur,style:{colour:"#ff0"}}])
            for(var i=0;i<radj[cur].length;i++){
                var nxt=radj[cur][i]
                outdegs[nxt[0]]--
                lts[nxt[0]]=Math.min(lts[nxt[0]],lts[cur]-(curGraph.edges[nxt[1]].weight??0))
                if(outdegs[nxt[0]]==0){
                    dfs_st.push(nxt[0])
                }
            }
        }
        for(var i=0;i<curGraph.edges.length;i++){
            if(curGraph.edges[i].weight){
                var lt=lts[curGraph.edges[i].v2]
                var et=ets[curGraph.edges[i].v1]
                var wei=curGraph.edges[i].weight
                steps.push([{type:"output",text:"Edge "+curGraph.edges[i].label+` float ${lt}-${et}-${wei}=`+(lt-et-wei)+((lt-et-wei)==0?" (critical)":"")},{type:"edge",index:i,style:{colour:(lt-et-wei)==0?"red":"#00a"}}])
            }
        }

        return steps
    }
}
