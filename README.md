# random-everything-generator
 
Random Everything Generator gives the user acccess to nearly 250 collections of random tables to describe just about anything.

## Support
If you like this module, and would like to support my efforts, please visiy my **[Patreon](https://www.patreon.com/darthcluck)**. Patreon supporters will have access to even more tables!

If you would like to contact me, you can find me on Discord `DarthCluck#3518`

## Generating Something

To get started, click on the Rollable Tables tab in Foundry, and click on the new button "Randomly Generate."

![Screenshot 1](https://dmscreen.net/pics/reg-ss-1.png)

This will bring up a window of categories for you to choose from. Selecting a category will either bring up a randomly generated table or sub-categories. Keep choosing sub-categories until you get to the randomly generated table you want.

![Screenshot 1](https://dmscreen.net/pics/reg-ss-2.png)

![Screenshot 1](https://dmscreen.net/pics/reg-ss-3.png)

## Changing Your Results
The initially generated table may be enough for most people, but if you're not happy with the results, you have options on how to improve them.

1. Clicking the regenerate button ![Screenshot 1](https://dmscreen.net/pics/reg-ss-4.png) next to a result will create a new value. Keep clicking it until you find something you like!
2. Would you rather just select one of the possible results, instead of having one selected for you? Click on the drop down button ![Screenshot 1](https://dmscreen.net/pics/reg-ss-4.png) and select one from the list 
3. STILL not happy with the results? You can always type in your own. Click on the drop down button ![Screenshot 1](https://dmscreen.net/pics/reg-ss-4.png) and type in what you want the value to be.
4. Sometimes the generator will create more than you're interested in. For example, a random castle will have something hidden inside of it, but that's just not something you want in your story. Click the minus ![Screenshot 1](https://dmscreen.net/pics/reg-ss-5.png) and remove the result entirely.

## Diving Deeper
Random Everything Generator can link tables together, allowing you to build an entire story around what you create. For example, a randomly generated castle, results in it having been built by an Elf Prince. But what if you want to know more about that prince? When a result can give you more details, it will be linked in a box. You can click on that link to open a new window describing that result further. Perhaps the result about the prince, is that he has a letter by a powerful lord. You can click on the "lord" link to find out more about who wrote the letter. You can do this indefinitely to build a very indepth story.

## Members
Another way to add detail to a story is with Members. Members are additional elements that can be added to a table that belong to it. For example, in a castle might be a castle chamber. Members are different from links in that they are not linked to a specific result, and you can have multiple of the same type. Like with a castle, it could have many chambers.

## Saving Your Story
At any time, you can click the "Save" button in the title bar of any window. This will save your entire generated story. Saved stories can be accessed in the drop down menu next to the "Randomly Generate" button in the Rollable Tables directory.

## For Macro Writers

If you wish to open a new table with a macro, you simply need to call `RandomEverythingGenerator.start()`. This is the same as clicking on the "Random Story" button. The `.start()` function optionally accepts a single argument, being the id of a table you wish to start with.

``
RandomEverythingGenerator.start('npc')
``

### Opening a new window

`RandomEverythingGenerator.start()` - Same as clicking the bu