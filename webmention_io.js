/**
 *  WebMentions.io JS
 *  https://github.com/aarongustafson/jekyll-webmention_io
 *  A re-tooling of Aaron Parecki’s recommended JS for using the WebMention.io API
 * 
 *  Updates Webmentions on a static site immediately when the page is loaded and
 *  in real-time (using WebSockets) as the user engages with the page.
 */
    
;(function(window){
    
    if ( !( 'AG' in window ) ){ window.AG = {}; }

    var $webmentions_list = document.querySelectorAll( '.webmentions__list' ),
        elements = {
            a:          document.createElement('a'),
            article:    document.createElement('article'),
            div:        document.createElement('div'), 
            photo:      document.createElement('img'),
            li:         document.createElement('li'),
            time:       document.createElement('time')
        },
        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        json_webmentions,
        this_page = window.location.href;

    // bail early
    if ( $webmentions_list.length < 1 ){ return; }
    $webmentions_list = $webmentions_list[0];
    
    // Set up the markup
    elements.li.className = 'webmentions__item';
    elements.article.className = 'webmention';
    elements.time.className = 'webmention__pubdate';
    elements.author = elements.div.cloneNode();
    elements.author.className = 'webmention__author vcard';
    elements.author_link = elements.a.cloneNode();
    elements.author_link.className = 'fn url';
    elements.photo.className = 'webmention__author__photo photo';
    elements.photo.alt = '';
    elements.title = elements.div.cloneNode();
    elements.title.className = 'webmention__title';
    elements.permalink = elements.a.cloneNode();
    elements.permalink.className = 'webmention__source';
    elements.permalink.appendChild( document.createTextNode('Permalink') );
    elements.content = elements.div.cloneNode();
    elements.content.className = 'webmention__content';
    elements.meta = elements.div.cloneNode();
    elements.meta.className = 'webmention__meta';
    
    function addMention( mention )
    {
        var streaming = !( 'data' in mention ),
            data = streaming ? mention : mention.data,
            id = streaming ? mention.element_id : mention.id;
        
        var $existing_mention = document.querySelectorAll( '#webmention-' + id  ),
            $item = elements.li.cloneNode( true ),
            $mention = elements.article.cloneNode( true ),
            $author = elements.author.cloneNode( true ),
            $author_link = elements.author_link.cloneNode( true ),
            $author_photo = elements.photo.cloneNode( true ),
            $meta = elements.meta.cloneNode( true ),
            $pubdate = elements.time.cloneNode( true ),
            $block,
            $link,
            title = data.name,
            content = data.content,
            url = data.url,
            author = data.author.name,
            author_photo = data.author.photo,
            pubdate,
            display_date = '';

        $item.id = 'webmention-' + id;
        $item.appendChild( $mention );

        if ( author )
        {
            $author_link.href = data.author.url;
            if ( author_photo )
            {
                $author_photo.src = author_photo;
                $author_link.appendChild( $author_photo );
            }
            $author_link.appendChild( document.createTextNode( author ) );
            $author.appendChild( $author_link );
            $mention.appendChild( $author );
        }


        $pubdate.setAttribute( 'datetime', data.published );
        pubdate = new Date( data.published );
        display_date += pubdate.getUTCDate() + ' ';
        display_date += months[ pubdate.getUTCMonth() ] + ' ';
        display_date += pubdate.getUTCFullYear();
        $pubdate.appendChild( document.createTextNode( display_date ) );
        $meta.appendChild( $pubdate );

        // no doubling up
        if ( title && content &&
             title == content )
        {
            title = false;
        }


        if ( title )
        {
            $mention.className += ' webmention--title-only';

            $link = elements.a.cloneNode( true );
            $link.href = url;
            $link.appendChild( document.createTextNode( data.name ) );

            $block = elements.title.cloneNode( true );
            $block.appendChild( $link );
            $mention.appendChild( $block );

            $mention.appendChild( $meta );
        }
        else if ( content )
        {
            $mention.className += ' webmention--content-only';

            $meta.appendChild( document.createTextNode( ' | ' ) );
            $link = elements.permalink.cloneNode( true );
            $link.href = url;
            $meta.appendChild( $link );
            $mention.appendChild( $meta );

            // TODO: Add Markdown
            $block = elements.content.cloneNode( true );
            $block.appendChild( document.createTextNode( content ) );
            $mention.appendChild( $block );
        }
        
        if ( $existing_mention.length < 1 )
        {
            $webmentions_list.appendChild( $item );
        }
        else
        {
            $webmentions_list.replaceChild( $item, $existing_mention[0] );
        }
        
        // Release
        $item = null;
        $existing_mention = null;
        $mention = null;
        $author = null;
        $author_link = null;
        $author_photo = null;
        $block = null;
        $link = null;
        $meta = null;
        $pubdate = null;
    }
    
    window.AG.processWebmentions = function( data ){
        data.links.reverse();
        data.links.forEach( addMention );
    };
    
    // Load up any unpublished webmentions on load
    json_webmentions = document.createElement('script');
    json_webmentions.async = true;
    json_webmentions.src = 'http://webmention.io/api/mentions?jsonp=window.AG.processWebmentions&target=' + this_page;
    document.getElementsByTagName('head')[0].appendChild( json_webmentions );
    
    // Listen for new ones
    if ( $webmentions_list.length &&
        "WebSocket" in window )
    {
        var ws = new WebSocket('ws://webmention.io:8080');
        
        ws.onopen = function( event ){
            // Send the current window URL to the server to register to receive notifications about this URL
            ws.send( this_page );
        };
        ws.onmessage = function( event ){
            addMention( JSON.parse( event.data ) );
        };
    }
    
}(window));