# Strange New Worlds of networked thought
This plugin helps you to see the connections between the different parts of your vault.

The basic idea is I want to see when links, block references and embeds have associations with other files in my vault. The problem is you have to search, open backlinks and such to find out what is going on. But there are so many strange new worlds of networked thought to discover in my vault. This plugin attempts to surface that information and not be to intrusive (or not too intrusive).

# Lazy networking (linking)
I am not known to be lazy, but for this plugin I had to be. This plugin leverages the indexing Obsidian does in the background, which is amazing. However, for performance reasons some things don't update right away. So some of the numbers shown by this plugin may be off as you work with links, embeds and blocks. But eventaully they will be correct. Eventually is better than nothing, right?

# Prototype insatity
So I have invested 0 time into the presentation and formatting. So I am sorry it is ugly. But its a prototype. Let us prove the concept before adding the polish. Having said that, I left many breadcrumbs in the CSS for you to format the presentation. Consult the sytles css for the class definitions: https://github.com/TfTHacker/obsidian42-strange-new-worlds/blob/master/src/styles.css

# odd issues
Modifying the underyling Obsidian rendering engine is not easy. It is a complex piece of software. There are some issues I have not been able to resolve, so have had to compromise. I will list such examples as they surface here:
- An embed marked to render its display that is on its own line will force the reference counter to the next line. So if you have typed on a line something like this, all by itself: `![[MyPage#header1]]` it will show any block reference counts on the following line. However if the same text is entered as: `- ![[MyPage#header1]]`, that is, with any other text, it will render the block references as by design.

## Credit
I need to thank [Sam](https://github.com/Shabegom) and [Murf Man](https://github.com/gitmurf) for all their inspiration and work from this plugin: https://github.com/shabegom/obsidian-reference-count. 

