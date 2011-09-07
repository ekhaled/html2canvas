html2canvas.canvasContext = function(width, height){
    this.storage = [];
    this.width = width;
    this.height = height;
    //this.zIndex;
    
    // todo simplify this whole section
    this.fillRect = function(x, y, w, h){
        this.storage.push(
        {
            type: "function",
            name:"fillRect",
            arguments: [x,y,w,h]            
        });
        
    };
    

        
    this.drawImage = function(image,sx,sy,sw,sh,dx,dy,dw,dh){     
        this.storage.push(
        {
            type: "function",
            name:"drawImage",
            arguments:[image,sx,sy,sw,sh,dx,dy,dw,dh]            
        });
    };
    
    this.fillText = function(currentText,x,y){
        
        this.storage.push(
        {
            type: "function",
            name:"fillText",
            arguments:[currentText,x,y]            
        });      
    }  
    
    
    this.setVariable = function(variable, value){
            this.storage.push(
            {
                type: "variable",
                name: variable,
                arguments: value            
            });
    }
    
    return this;
    
}