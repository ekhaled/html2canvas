html2canvas.Renderer = function(parseQueue, opts){


    var options = {
        "width": 0,
        "height": 0  
    },
    queue = [],
    renderer = "canvas",
    canvas;

    function sortZ(zStack){
        var subStacks = [],
        stackValues = [],
        zStackChildren = zStack.children,
        s,
        i,
        stackLen,
        zValue,
        zLen,
        stackChild,
        b, 
        subStackLen;
        

        for (s = 0, zLen = zStackChildren.length; s < zLen; s+=1){
            
            stackChild = zStackChildren[s];
            
            if (stackChild.children && stackChild.children.length > 0){
                subStacks.push(stackChild);
                stackValues.push(stackChild.zindex);
            }else{         
                queue.push(stackChild);
            }  
           
        }
      
        stackValues.sort(function(a, b) {
            return a - b;
        });
    
        for (i = 0, stackLen = stackValues.length; i < stackLen; i+=1){
            zValue = stackValues[i];
            for (b = 0, subStackLen = subStacks.length; b <= subStackLen; b+=1){
                
                if (subStacks[b].zindex === zValue){
                    stackChild = subStacks.splice(b, 1);
                    sortZ(stackChild[0]);
                    break;
                  
                }
            }        
        }
  
    }

    function canvasRenderer(zStack){
 
        sortZ(zStack.zIndex);
        
        canvas.width = Math.max(window.innerWidth, options.width);   
        canvas.height = Math.max(window.innerHeight, options.height);
    
        var ctx = canvas.getContext("2d"),
        storageContext,
        i,
        queueLen,
        a,
        storageLen,
        renderItem;
        
          
        for (i = 0, queueLen = queue.length; i < queueLen; i+=1){
            
            storageContext = queue.splice(0, 1)[0];
            storageContext.canvasPosition = storageContext.canvasPosition || {};   
           
            //this.canvasRenderContext(storageContext,parentctx);           

            // set common settings for canvas
            ctx.textBaseline = "bottom";
   
            if (storageContext.clip){
                ctx.save();
                ctx.beginPath();
                // console.log(storageContext);
                ctx.rect(storageContext.clip.left, storageContext.clip.top, storageContext.clip.width, storageContext.clip.height);
                ctx.clip();
        
            }
        
            if (storageContext.ctx.storage){
               
                for (a = 0, storageLen = storageContext.ctx.storage.length; a < storageLen; a+=1){
                    
                    renderItem = storageContext.ctx.storage[a];
                    
                   
                    
                    switch(renderItem.type){
                        case "variable":
                            ctx[renderItem.name] = renderItem['arguments'];              
                            break;
                        case "function":
                            if (renderItem.name === "fillRect") {
                        
                                ctx.fillRect(
                                    renderItem['arguments'][0],
                                    renderItem['arguments'][1],
                                    renderItem['arguments'][2],
                                    renderItem['arguments'][3]
                                    );
                            }else if(renderItem.name === "fillText") {
                                // console.log(renderItem.arguments[0]);
                                ctx.fillText(renderItem['arguments'][0],renderItem['arguments'][1],renderItem['arguments'][2]);
                    
                            }else if(renderItem.name === "drawImage") {
                                //  console.log(renderItem);
                                // console.log(renderItem.arguments[0].width);    
                                if (renderItem['arguments'][8] > 0 && renderItem['arguments'][7]){
                                    ctx.drawImage(
                                        renderItem['arguments'][0],
                                        renderItem['arguments'][1],
                                        renderItem['arguments'][2],
                                        renderItem['arguments'][3],
                                        renderItem['arguments'][4],
                                        renderItem['arguments'][5],
                                        renderItem['arguments'][6],
                                        renderItem['arguments'][7],
                                        renderItem['arguments'][8]
                                        );
                                }      
                            }
                       
  
                            break;
                        default:
                               
                    }
            
                }

            }  
            if (storageContext.clip){
                ctx.restore();
            }
    

       
   
        }
        
        // this.canvasRenderStorage(queue,this.ctx);
        return canvas;
    }


    
    //this.each(this.opts.renderOrder.split(" "),function(i,renderer){
        
    switch(renderer){
        case "canvas":
            canvas = document.createElement('canvas');
            if (canvas.getContext){
                return canvasRenderer(parseQueue);
            //  _.log('Using canvas renderer');

            }               
            break;

             
    }
         
         
         
    //});

    return this;
     

    
};


