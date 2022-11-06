# Strange New Worlds of networked thought
This plugin helps you to see the connections between the different parts of your vault.

The basic idea is we want to see when links, block references and embeds have associations with other files in the vault. The problem is you have to search, open backlinks and so on to find out what is going on. But there are so many strange new worlds of networked thought to discover in our vault. This plugin attempts to resurface those connections and not be to intrusive (or not too intrusive) in doing so.

![](media/SNW.gif)

The Strange New Worlds plugin is abbreviated as SNW in this documentation.

SNW has been tested to work on mobile device and tablets.

Check out this video for an overview of this plugin: 

[![](media/YouTubeIntroVid.jpg)](https://youtu.be/i08ksJ-nK9c)

More features

[![](media/YouTubeFeatures.png)](https://youtu.be/9mg6p4yWOVw)


# Lazy networking (linking)
We are not known to be lazy, but for this plugin we had to be. This plugin leverages the indexing Obsidian does in the background, which is amazing. However, for performance reasons some things don't update right away. So depending on what you are doing, reference counts sometimes shown by this plugin may be incorrect as you work with links, embeds and blocks. But eventaully they will be correct as the cache updates itself. It is better than nothing, right?

# SNW References
When a reference is displayed either in a hover popup or the sidepane, it can be clicked to be opened. By default it will open in the current pane. However using the following keyboard commands, you have more control over how they open.
+ CTRL/CMD + Click - Opens reference in a new tab
+ CTRL/CMD + SHIFT + Click - Opens reference in a new horizontal pane (split down)
+ CTRL/CMD + ALT + Click - Opens reference in a new vertical pane (split right)
+ Alt + Click - Opens reference in a new window

# SNW frontmatter directives
The following can be added to a file's front matter to provide more control to SNW's behavior
+ add `snw-index-exclude: true` - prevents SNW from including this file in its index. This means any links to this file will not display block counts
+ add `snw-file-exclude: true` - prevents any block reference counters from being displayed on the current page. Basically turns it off SNW for the page. NOTE: This will not affect embeded links. Embed files must have this YAML property set as well to have its counters excluded.

# odd issues
Modifying the underyling Obsidian rendering engine is not easy. It is a complex piece of software. There are some issues we have not been able to resolve, so we had to compromise. We will list such examples as they surface here:
- An embed marked to render its display that is on its own line will force the reference counter to the next line. So if you have typed on a line something like this, all by itself: `![[MyPage#header1]]` it will show any block reference counts on the following line. However if the same text is entered as: `- ![[MyPage#header1]]`, that is, with any other text, it will render the block references as by design.

## Credit
I need to thank [Sam](https://github.com/Shabegom) and [Murf Man](https://github.com/gitmurf) for all their inspiration and work from this plugin: https://github.com/shabegom/obsidian-reference-count. 

# Say Thank You
If you are enjoying this plugin then feel free to buying me a coffee on [https://ko-fi/TfTHacker](https://ko-fi.com/TfTHacker).

Please also help spread the word by sharing your enthusiasim for this plugin on Twitter, Reddit, or any other social media platform you regularly use. 

You can find me on Twitter [@TfTHacker](https://twitter.com/TfTHacker)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/N4N16TNFD)
