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
            //[2]
            //retas normais vao ser pra dentro, logo o angulo deve ser agudo, o PI nao pode ser negativo
            //
        }
        else if (shape === "polygon") {
            //[3]
            //dividir em triangulos
            //testar cada triangulo
        }
        else {
            throw "Choose between possible primitives: circle, triangle, polygon";
        }
    }


    function Screen(width, height, scene) {
        this.width = width;
        this.height = height;
        this.scene = this.preprocess(scene);
        this.createImage();
    }

    Object.assign(Screen.prototype, {

        preprocess: function (scene) {
            // Possible preprocessing with scene primitives, for now we don't change anything
            // You may define bounding boxes, convert shapes, etc

            var preprop_scene = [];
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            for (var primitive of scene) {
                //iterar pelos vertices (fazer uma funcao)
                for (let vertex of scene.vertices){
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

                preprop_scene.push(primitive);

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

