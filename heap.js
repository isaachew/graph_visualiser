class Heap{
    arr;cmp
    constructor(cmp){
        this.arr=[]
        this.cmp=cmp??((a,b)=>a<b)
    }
    hdown(x){
        var mn=x*2+1
        if(x*2+1>=this.arr.length)return
        if(x*2+2<this.arr.length&&this.cmp(this.arr[x*2+2],this.arr[x*2+1])){
            mn=x*2+2
        }
        if(this.cmp(this.arr[mn],this.arr[x])){
            [this.arr[mn],this.arr[x]]=[this.arr[x],this.arr[mn]]
            this.hdown(mn)
        }
    }
    hup(x){
        if(x==0)return
        var mn=(x-1)>>1
        if(this.cmp(this.arr[x],this.arr[mn])){
            [this.arr[mn],this.arr[x]]=[this.arr[x],this.arr[mn]]
            this.hup(mn)
        }
    }
    push(x){
        this.arr.push(x)
        this.hup(this.arr.length-1)
    }
    pop(x){
        if(this.arr.length==0)return
        var val=this.arr[0]
        var pe=this.arr.pop()
        if(this.arr.length){
            this.arr[0]=pe
            this.hdown(0)
        }
        return val
    }
    get length(){
        return this.arr.length
    }
}
