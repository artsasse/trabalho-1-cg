(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.BasicRenderer = {}));
}(this, (function (exports) {
    'use strict';


    /* ------------------------------------------------------------ */



    function inside(x, y, primitive) {

        let shape = primitive.shape;
        let minX  = primitive.minX;
        let maxX = primitive.maxX;
        let minY = primitive.minY;
        let maxY = primitive.maxY;

        //verificar se esta dentro da boundary box
        if( (x < minX) || (x > maxX) ){
            return false;
        }
        if( (y < minY) || (y > maxY) ){
            return false;
        }

        if (shape === "circle") {
            //[1]
            //dividir em triangulos
            //testar cada triangulo
        }
        else if (shape === "triangle") {
            //[2] Produto Vetorial
            let p0 = primitive.vertices[0];
            let p1 = primitive.vertices[1];
            let p2 = primitive.vertices[2];
            //p1 - p0
            let u = [p1[0] - p0[0], p1[1] - p0[1]];
            //p2 - p1
            let v = [p2[0] - p1[0], p2[1] - p1[1]];
            //p0 - p2
            let w = [p0[0] - p2[0], p0[1] - p2[1]];
            let point = [x,y];
            //Verificar orientacao do triangulo
            let triangleOrientation = isCounterClockwise(u,v);
            //verificar se ponto esta dentro do triangulo
            //teste com p0 e u
            if(!hasSameOrientation(point, p0, u, triangleOrientation)){
                return false;
            }
            //teste com p1 e v
            if(!hasSameOrientation(point, p1, v, triangleOrientation)){
                return false;
            }
            //teste com p2 e w
            if(!hasSameOrientation(point, p2, w, triangleOrientation)){
                return false;
            }
            return true;
        }
        else if (shape === "polygon") {
            //[3]
            //fan triangulation ou winding/crossing number
        }
        else {
            throw "Choose between possible primitives: circle, triangle, polygon";
        }
    }

    function boundObject(primitive){
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        
        for (let vertex of primitive.vertices){
            if(vertex[0] < minX){
                minX = vertex[0];
            }
            if(vertex[0] > maxX){
                maxX = vertex[0];
            }
            if(vertex[1] < minY){
                minY = vertex[1];
            }
            if(vertex[1] > maxY){
                maxY = vertex[1];
            }
        }
        //adicionar propriedades com os boundaries
        primitive.minX = minX;
        primitive.maxX = maxX;
        primitive.minY = minY;
        primitive.maxY = maxY;
    }

    function boundObjects(primitives){
        for(let primitive of primitives){
            boundObject(primitive);
        }
    }

    function transformObject(primitive){

        let vertices = primitive.vertices;

        //converter matriz de transformacao afim para nj.array
        let matrix = nj.array(primitive.xform);
        
        //fatiar a matriz de transformacao afim
        let linearTransformationMatrix = matrix.slice([0,2],[0,2]);
        let translationVector = matrix.slice([0,2],2).flatten();
        
        //aplicar a transformacao afim  
        vertices.forEach(function(item, index){
            //converter vertice para nj.array
            vertices[index] = nj.array(vertices[index]);
        
            //aplicar matriz 2x2 de transformacao linear nos pontos
            vertices[index] = nj.dot(linearTransformationMatrix,vertices[index]);

            //somar vetor de translacao aos pontos
            vertices[index].add(translationVector, false);

            //converter tudo para array normal de novo
            vertices[index] = vertices[index].tolist();
        })
    }

    function transformObjects(primitives){
        for(let primitive of primitives){
            transformObject(primitive);
        }
    }


    function Screen(width, height, scene) {
        this.width = width;
        this.height = height;
        this.scene = this.preprocess(scene);
        this.createImage();
    }

    function crossProduct2D(u,v){
        let r1 = u[0] * v[1];
        let r2 = u[1] * v[0];
        return r1 - r2;
    }

    function isCounterClockwise(u,v){
        let result = crossProduct2D(u,v)
        if(result > 0){
            return true;
        }
        else{
            return false;
        }
    }

    function hasSameOrientation(point, edge, vector, objOrientation){
        let orientation;
        let testedVector = [point[0] - edge[0], point[1] - edge[1]];
        orientation = isCounterClockwise(vector,testedVector);
        return orientation === objOrientation;
    }

    function fanTriangulation(primitive){
        let triangles = [];
        let triangle;
        let n = primitive.vertices.length - 2;
        let vertices = primitive.vertices;
        let i = 1;
        while(n > 0){
            if(primitive.hasOwnProperty('xform')){
                triangle = {  
                    shape: "triangle",
                    vertices: [vertices[0], vertices[i], vertices[i+1]],
                    color: primitive.color,
                    xform: primitive.xform   
                }
            }
            else{
                triangle = {  
                    shape: "triangle",
                    vertices: [vertices[0], vertices[i], vertices[i+1]],
                    color: primitive.color    
                }
            }
            triangles.push(triangle);
            i++;
            n--;
        }
        return triangles;
    }

    function pushPrimitives(primitives, preprop_scene){
        for (let primitive of primitives){
            preprop_scene.push(primitive);
        }
    }

    Object.assign(Screen.prototype, {

        preprocess: function (scene) {

            var preprop_scene = [];
            let primitives;

            for (var primitive of scene) {
                //triangular poligono
                if(primitive.shape === "polygon"){
                    primitives = fanTriangulation(primitive);
                }
                // else if(primitive.shape === "circle"){
                //     primitives = circleTriangulation(primitive);
                // }
                else if(primitive.shape === "triangle"){
                    primitives = [primitive];
                }
                
                //[4]calcular transformacoes afins
                if (primitive.hasOwnProperty('xform')){
                    transformObjects(primitives);
                }

                boundObjects(primitives);

                pushPrimitives(primitives, preprop_scene);
            }


            return preprop_scene;
        },

        createImage: function () {
            this.image = nj.ones([this.height, this.width, 3]).multiply(255);
        },

        rasterize: function () {
            var color;

            // In this loop, the image attribute must be updated after the rasterization procedure.
            for (var primitive of this.scene) {

                // Loop through all pixels
                for (var i = 0; i < this.width; i++) {
                    var x = i + 0.5;
                    for (var j = 0; j < this.height; j++) {
                        var y = j + 0.5;

                        // First, we check if the pixel center is inside the primitive 
                        if (inside(x, y, primitive)) {
                            // only solid colors for now
                            color = nj.array(primitive.color);
                            this.set_pixel(i, this.height - (j + 1), color);
                        }

                    }
                }
            }



        },

        set_pixel: function (i, j, colorarr) {
            // We assume that every shape has solid color

            this.image.set(j, i, 0, colorarr.get(0));
            this.image.set(j, i, 1, colorarr.get(1));
            this.image.set(j, i, 2, colorarr.get(2));
        },

        update: function () {
            // Loading HTML element
            var $image = document.getElementById('raster_image');
            $image.width = this.width; $image.height = this.height;

            // Saving the image
            nj.images.save(this.image, $image);
        }
    }
    );

    exports.Screen = Screen;

})));

