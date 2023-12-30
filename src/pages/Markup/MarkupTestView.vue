<template>
  <page-layout :use-social-links="false">
    <template #title> Тиамат </template>

    <template #subtitle> Tiamat </template>

    <template #default>
      <markup-render :entry="test" />
    </template>
  </page-layout>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import MarkupRender from '@/shared/compositions/useMarkupRender/components/MarkupRender.vue';

  export default defineComponent({
    components: {
      MarkupRender,
      PageLayout
    },
    setup() {
      /* eslint-disable vue/max-len */
      const test = {
        name: '# The Homebrewery *V3*',
        source: '',
        page: 0,
        entries: [
          '### Homebrew D&D made easy',
          'The Homebrewery makes the creation and sharing of authentic looking Fifth-Edition homebrews easy. It uses [Markdown](https://help.github.com/articles/markdown-basics/) with a little CSS magic to make your brews come to life.',
          '**Try it!** Simply edit the text on the left and watch it *update live* on the right. Note that not every button is visible on this demo page. Click New {{fas,fa-plus-square}} in the navbar above to start brewing with all the features!',
          {
            type: 'entries',
            name: '### Editing and Sharing',
            entries: [
              'When you create your own homebrew, you will be given a *edit url* and a *share url*.',
              'Any changes you make while on the *edit url* will be automatically saved to the database within a few seconds. Anyone with the edit url will be able to make edits to your homebrew, so be careful about who you share it with.',
              'Anyone with the *share url* will be able to access a read-only version of your homebrew.',
              '{{note ##### PDF Creation PDF Printing works best in Google Chrome. If you are having quality/consistency issues, try using Chrome to print instead.',
              'After clicking the "Print" item in the navbar a new page will open and a print dialog will pop-up.',
              '* Set the **Destination** to "Save as PDF"'
            ]
          },
          {
            type: 'entries',
            name: '* Set **Paper Size** to "Letter"',
            entries: [
              '* If you are printing on A4 paper, make sure to have the **PRINT → {{far,fa-file}} A4 Pagesize** snippet in your brew',
              '* In **Options** make sure "Background Images" is selected.',
              "* Hit print and enjoy! You're done!",
              'If you want to save ink or have a monochrome printer, add the **PRINT → {{fas,fa-tint}} Ink Friendly** snippet to your brew!'
            ]
          },
          {
            type: 'entries',
            name: '}}',
            entries: [
              '![homebrew mug](http://i.imgur.com/hMna6G0.png) {position:absolute,bottom:20px,left:130px,width:220px}',
              '{{artist,bottom:160px,left:100px ##### Homebrew Mug [naturalcrit](https://homebrew.naturalcrit.com) }}',
              '{{pageNumber 1}}',
              '{{footnote PART 1 | FANCINESS}}',
              '\\column'
            ]
          },
          {
            type: 'entries',
            name: '## New in V3',
            entries: [
              '0.0',
              "We've implemented an extended Markdown-like syntax for block and span elements, plus a few other changes, eliminating the need for HTML tags like `div` and `span` in most cases. No raw HTML tags should be needed in a brew (*but can still be used if you insist*).",
              'Much of the syntax and styling has changed in V3, so converting a Legacy brew to V3 (or vice-versa) will require tweaking your document. *However*, all brews made prior to the release of v3.0.0 will still render normally, and you may switch between the "Legacy" brew renderer and the newer "V3" renderer via the {{fa,fa-info-circle}} **Properties** button on your brew at any time.',
              'Scroll down to the next page for a brief summary of the changes and new features available in V3!',
              '#### New Things All The Time!',
              'Check out the latest updates in the full changelog [here](/changelog).',
              '### Helping out',
              'Like this tool? Want to buy me a beer? [Head here](https://www.patreon.com/Naturalcrit) to help me keep the servers running.',
              'This tool will **always** be free, never have ads, and I will never offer any "premium" features or whatever.'
            ]
          },
          {
            type: 'entries',
            name: '### Bugs, Issues, Suggestions?',
            entries: [
              'Take a quick look at our [Frequently Asked Questions page](/faq) to see if your question has a handy answer.',
              'Need help getting started or just the right look for your brew? Head to [r/Homebrewery](https://www.reddit.com/r/homebrewery/submit?selftext=true&title=%5BIssue%5D%20Describe%20Your%20Issue%20Here) and let us know!',
              "Have an idea to make The Homebrewery better? Or did you find something that wasn't quite right? Check out the [GitHub Repo](https://github.com/naturalcrit/homebrewery/) to report technical issues."
            ]
          },
          {
            type: 'entries',
            name: '### Legal Junk',
            entries: [
              'The Homebrewery is licensed using the [MIT License](https://github.com/naturalcrit/homebrewery/blob/master/license). Which means you are free to use The Homebrewery codebase any way that you want, except for claiming that you made it yourself.',
              "If you wish to sell or in some way gain profit for what's created on this site, it's your responsibility to ensure you have the proper licenses/rights for any images or resources used."
            ]
          },
          {
            type: 'entries',
            name: '#### Crediting Me',
            entries: [
              "If you'd like to credit me in your brew, I'd be flattered! Just reference that you made it with The Homebrewery."
            ]
          },
          {
            type: 'entries',
            name: '### More Homebrew Resources',
            entries: [
              "<a href='https://discord.gg/by3deKx' target='_blank'><img src='/assets/discordOfManyThings.svg' alt='Discord of Many Things Logo' title='Discord of Many Things Logo' style='width:50px; float: right; padding-left: 10px;'/></a>",
              "If you are looking for more 5e Homebrew resources check out [r/UnearthedArcana](https://www.reddit.com/r/UnearthedArcana/) and their list of useful resources [here](https://www.reddit.com/r/UnearthedArcana/wiki/resources). The <a href='https://discord.gg/by3deKx' target='_blank' title='Discord of Many Things'>Discord of Many Things</a> is another great resource to connect with fellow homebrewers for help and feedback.",
              "{{position:absolute;top:20px;right:20px;width:auto <a href='https://discord.gg/by3deKx' target='_blank' title='Discord of Many Things' style='color: black;'><img src='/assets/discord.png' style='height:30px'/></a> <a href='https://github.com/naturalcrit/homebrewery' target='_blank' title='Github' style='color: black; padding-left: 5px;'><img src='/assets/github.png' style='height:30px'/></a> <a href='https://patreon.com/NaturalCrit' target='_blank' title='Patreon' style='color: black; padding-left: 5px;'><img src='/assets/patreon.png' style='height:30px'/></a> <a href='https://www.reddit.com/r/homebrewery/' target='_blank' title='Reddit' style='color: black; padding-left: 5px;'><img src='/assets/reddit.png' style='height:30px'/></a> }}",
              '\\page'
            ]
          },
          {
            type: 'entries',
            name: '## Markdown+',
            entries: [
              'The Homebrewery aims to make homebrewing as simple as possible, providing a live editor with Markdown syntax that is more human-readable and faster to write with than raw HTML.',
              'In version 3.0.0, with a goal of adding maximum flexibility without users resorting to complex HTML to accomplish simple tasks, Homebrewery provides an extended verision of Markdown with additional syntax.',
              '**You can enable V3 via the {{fa,fa-info-circle}} Properties button!**'
            ]
          },
          {
            type: 'entries',
            name: '### Curly Brackets',
            entries: [
              "The biggest change in V3 is the replacement of `<span></span>` and `<div></div>` with `{{ }}` for a cleaner custom formatting.  Inline spans and block elements can be created and given ID's and Classes, as well as css properties, each of which are comma separated with no spaces. Use double quotes if a value requires spaces. Spans and Blocks start the same:"
            ]
          },
          {
            type: 'entries',
            name: '#### Span',
            entries: [
              'My favorite author is {{pen,#author,color:orange,font-family:"trebuchet ms" Brandon Sanderson}}.  The orange text has a class of `pen`, an id of `author`, is colored orange, and given a new font. The first space outside of quotes marks the beginning of the content.'
            ]
          },
          {
            type: 'entries',
            name: '#### Block',
            entries: [
              '{{purple,#book,text-align:center,background:#aa88aa55 My favorite book is Wheel of Time. This block has a class of `purple`, an id of `book`, and centered text with a colored background. The opening and closing brackets are on lines separate from the block contents. }}'
            ]
          },
          {
            type: 'entries',
            name: '#### Injection',
            entries: [
              'For any element not inside a span or block, you can *inject* attributes using the same syntax but with single brackets in a single line immediately after the element.',
              'Inline elements like *italics* {color:#{@dice  D 35400}} or images require the injection on the same line.',
              'Block elements like headers require the injection to start on the line immediately following.',
              '##### A Purple Header',
              '{color:purple,text-align:center}',
              '\\* *this does not currently work for tables yet*'
            ]
          },
          {
            type: 'entries',
            name: '### Vertical Spacing',
            entries: [
              "A blank line can be achieved with a run of one or more `:` alone on a line. More `:`'s will create more space."
            ]
          },
          {
            type: 'entries',
            name: '::',
            entries: ['Much nicer than `<br><br><br><br><br>`']
          },
          {
            type: 'entries',
            name: '### Definition Lists',
            entries: []
          },
          {
            type: 'entries',
            name: '**Example** ',
            entries: [
              'V3 uses HTML *definition lists* to create "lists" with hanging indents.'
            ]
          },
          {
            type: 'entries',
            name: '### Column Breaks',
            entries: [
              'Column and page breaks with `\\column` and `\\page`.',
              '\\column'
            ]
          },
          {
            type: 'entries',
            name: '### Tables',
            entries: [
              'Tables now allow column & row spanning between cells. This is included in some updated snippets, but a simplified example is given below.',
              'A cell can be spanned across columns by grouping multiple pipe `|` characters at the end of a cell.',
              'Row spanning is achieved by adding a `^` at the end of a cell just before the `|`.',
              "These can be combined to span a cell across both columns and rows. Cells must have the same colspan if they are to be rowspan'd."
            ]
          },
          {
            type: 'entries',
            name: '## Images',
            entries: [
              'Images must be hosted online somewhere, like [Imgur](https://www.imgur.com). You use the address to that image to reference it in your brew\\*.',
              'Using *Curly Injection* you can assign an id, classes, or inline CSS properties to the Markdown image syntax.',
              '![alt-text](https://s-media-cache-ak0.pinimg.com/736x/4a/81/79/4a8179462cfdf39054a418efd4cb743e.jpg) {width:100px,border:"2px solid",border-radius:10px}',
              '\\* *When using Imgur-hosted images, use the "direct link", which can be found when you click into your image in the Imgur interace.*'
            ]
          },
          {
            type: 'entries',
            name: '## Snippets',
            entries: [
              'Homebrewery comes with a series of *code snippets* found at the top of the editor pane that make it easy to create brews as quickly as possible.  Just set your cursor where you want the code to appear in the editor pane, choose a snippet, and make the adjustments you need.'
            ]
          },
          {
            type: 'entries',
            name: '## Style Editor Panel',
            entries: [
              '{{fa,fa-paint-brush}} Technically released prior to v3 but still new to many users, check out the new **Style Editor** located on the right side of the Snippet bar.  This editor accepts CSS for styling without requiring `<style>` tags-- anything that would have gone inside style tags before can now be placed here, and snippets that insert CSS styles are now located on that tab.',
              '{{pageNumber 2}}',
              '{{footnote PART 2 | BORING STUFF}}'
            ]
          }
        ]
      };
      /* eslint-enable vue/max-len */

      return {
        test
      };
    }
  });
</script>
