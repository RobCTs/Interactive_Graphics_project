# 3D Persona
Persona model  


## Overview
The objective is to create a 3D persona that can move around. The project is developed using Blender 4.1.


## Software and Tools
- **Blender Version:** 4.1  
- **Blender Addons:** LoopTools (activated, but no additional plugins used)  
No specific configurations or environments are required for this project. Simply open Blender and begin your modeling process.

## Modeling Process
### Reference Setup
Gather reference images for both the body and head. I used [these references](https://www.patreon.com/posts/references-free-60842916?utm_medium=clipboard_copy&utm_source=copy_to_clipboard&utm_campaign=postshare).  

Scale the reference images to a height of 1.70 cm to match the intended height of the woman character. Duplicate the references and position them in front and to the left of a cube, simulating a modeling booth centered on the world origin. Ensure the head reference fits the body reference appropriately.  

### Head Modeling
- ![Head with vertices](images/Head_vertex.png)
Start by modeling the head using a plane and manipulating it to follow the coloured guidelines of the head reference. In order to model the surface better, use vertices, adjusting them according to the reference images. Repeat until you have the head (leave out the eye, mouth and ear area).

![Eye mask](images/Eye_mask.png)
![Earlobe](images/Ear_lobe.png)

Then start modelling the eye, mouth and ear as separate entities. Use a circle to shape the eye and mouth regions. Create the eyeball with an UV sphere. Use an additional reference image to model the ears. Utilize proportional editing to refine curves and achieve a more natural look.

![Final Results](images/Final_result_head.mp4).


### Body Modeling
![Torso](images/Torso_with_reference.png)
Begin with a cylinder to model the body. Shape the torso always by modelling the vertices and ajusting them based on the reference. 

Beware, when looking at the front reference adjust only on the x axis, for the left only the y!

Then proceed to model the arms and legs. At the end feet and hands.

![Final Results](images/Final_result_body.mp4).

## TODO
## Texturing
1. **UV Unwrapping**: Unwrap the model for texture application.
2. **Texture Painting**: Apply textures using Blender's texture painting tools or external software if needed.

## Materials and Shading
1. **Material Creation**: Create materials and assign them to different parts of the model.
2. **Shader Setup**: Set up shaders to enhance the visual quality of the model.

## Rigging
1. **Armature Creation**: Create an armature (skeleton) for the model.
2. **Weight Painting**: Paint weights to ensure proper deformation during animation.

## Animation
1. **Basic Animations**: Create basic animations such as walking, idle, etc.
2. **Controls**: Set up controls for easy animation manipulation.
