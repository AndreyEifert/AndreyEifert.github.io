function App ( e, D ) {

    const S = []
    const I = {}
    const FN = {}
    const IT = 'ontouchstart' in window
    const EVS = {
        down: IT ? 'touchstart' : 'mousedown',
        move: IT ? 'touchmove'  : 'mousemove',
        up:   IT ? 'touchend'   : 'mouseup'
    }
    const U = {
        data: D,
        ids: I,
        DOWN: EVS.down,
        MOVE: EVS.move,
        UP:   EVS.up,
        ISTOUCH: IT
    }

    function DS ( e, is ) {
        if ( is ) {
            for ( var j = S.length - 1; j >= 0; j-- ) {
                const i = S[ j ]

                if ( i.e.indexOf( e ) !== -1 ) i.is = false;
            }
        }
        var n = e.firstChild; while ( e = n ) { n = e.nextSibling; DS( e, true ); }
    }
    function EN ( e, is ) {
        if ( is ) {
            for ( var j = S.length - 1; j >= 0; j-- ) {
                const i = S[ j ]

                if ( i.e.indexOf( e ) !== -1 ) i.is = true;
            }
        }
        var n = e.firstChild; while ( e = n ) { n = e.nextSibling; EN( e, true ); }
    }

    function CL ( a ) {
        if ( Array.isArray( a ) )    { const r = []; for ( var i of a ) r.push(  CL( i ) );    return r };
        if ( typeof a === 'object' ) { const r = {}; for ( var k in a ) r[ k ] = CL( a[ k ] ); return r };
        return a
    }
    function EQ ( a, b ) {
        if ( Array.isArray( a ) ) {
            if ( !Array.isArray( b ) || ( a.length !== b.length ) ) return false
            else if ( typeof a === 'object' ) {
                if ( typeof b !== 'object' || ( Object.keys( a ).length !== Object.keys( b ).length ) ) return false
            }
            for ( var k in a ) if ( b[ k ] !== a[ k ] ) return false

            return true
        }
        return a === b
    }

    function UB ( e ) {
        for ( var j = S.length - 1; j >= 0; j-- ) {
            const i = S[ j ]

            if ( i.e.indexOf( e ) !== -1 ) {

                S.splice( j, 1 )

                let c
                while ( c = i.e.pop() ) {
                    if ( c !== e ) UB( c )
                }
            }
        }    
        var n = e.firstChild; while ( e = n ) { n = e.nextSibling; UB( e ); }
    }

    function C ( c, p, s ) {
        return new Function(
            'data' + ( s ? ',' + s : '' ),
            Object.keys( D ).map( k => `var ${ k } = data[ '${ k }' ];\r\n` ).join( '' ) +
            Object.keys( p ).map( k => `var ${ k } = ${ p[ k ] };\r\n` ).join( '' ) +
            'return ' + c
        )
    }
    function B ( e, f, p, c, ...a ) {
        S.push( { e, f, F: C( c, p ), a, is: true } )
    }
    function T_ ( v, e ) {
        e.textContent = v === undefined ? '' : v
    }
    function T ( e, p ) {

        let s = e.textContent, P = e.parentNode, ind = 0, o

        s.replace( /\{\{(.+?)\}\}/g, ( q, c, i ) => {
    
            P.insertBefore( document.createTextNode( s.substring( ind, i ) ), e )
            P.insertBefore( o = document.createTextNode( '-' ), e )

            B( [ o ], T_, p, c, o )

            ind = i + q.length
        } )

        e.textContent = s.substring( ind )
    }
    function F_ ( v, n, i, c, h, m, p, e ) {
        m.splice( v.length || 0 ).forEach( e => {
            UB( e )
            e.parentNode &&
            e.parentNode.removeChild( e )
        } );
        for ( var j = m.length; j < v.length; j++ ) {
            const E = e.cloneNode( e )

            p[ n ] = `( ${ c } )[ ${ j } ]`
            p[ i ] = j

            h.parentNode.insertBefore( E, h )
            m.push( E )

            P( E, p )
            
            delete p[ n ]
            delete p[ i ]
        }
    }
    function F ( e, p ) {
        const v = e.getAttribute( ':for' ); if ( !v ) return;
        const E = / *([\w_$]+)( *, *([\w_$]+))? *in *(.+)/.exec( v ); if ( !E ) return;

        const H = document.createComment( ':for' )
        const P = e.parentNode

        P.insertBefore( H, e )
        P.removeChild( e )

        e.removeAttribute( ':for' )

        B( [ H ], F_, p, E[ 4 ], E[ 1 ], E[ 3 ], E[ 4 ], H, [], CL( p ), e )

        return true
    }

    function AS ( v, e, q, s ) {
        e.style = q;
        for ( var k in v ) s[ k ] = v[ k ]
    }
    function AC ( v, e, q, c ) {
        e.className = q;
        if ( Array.isArray( v ) ) for ( var i of v ) c.add( i )
        else if ( typeof v === 'object' ) for ( var k in v ) !!v[ k ] && c.add( k )
        else if ( typeof v === 'string' ) !!v && c.add( v )
    }
    function AIS ( v, h, e, s ) {
        if ( !!v ) {
            h.parentNode.insertBefore( e, h )
            EN ( e )
        } else {
            e.parentNode &&
            e.parentNode.removeChild( e )
            DS( e )
        }
    }
    function AI ( v, e ) {
        e.value = v === undefined ? '' : v
    }
    function AA ( v, e, n, is ) {
        is ? e.setAttribute( n, v ) : e[ n ] = v
    }

    function A ( e, a ) {
        Array.from( e.attributes ).forEach( i => {
            let { value: v, name: n } = i

            if ( n === ':style' ) B( [ e ], AS, a, v, e, e.style + '', e.style    ); else
            if ( n === ':class' ) B( [ e ], AC, a, v, e, e.className, e.classList ); else
            if ( n === ':is' ) {
                const h = e.parentNode.insertBefore( document.createComment( 'is' ), e )
                B( [ h, e ], AIS, a, v, h, e, v );
            } else 
            if ( n === ':input' ) {
                const s = C( `( data['${ v }'] = ___VALUE___ );`, a, '___VALUE___,el, ev' )
                const i = e.type === 'number'

                e.addEventListener( 'input', ev => {
                    s( D, i ? parseFloat( e.value ) : e.value, e, ev )
                    CH( e )
                } )

                B( [ e ], AI, a, v, e )
            } else
            if ( n[ 0 ] === '@' ) {
                n = n.slice( 1 )

                let N = EVS[ n ] || n, f, E

                if ( E = /^\{(.+)\}$/.exec( v ) ) {
                    const F = C( E[ 1 ], a, 'el,ev,pos' )
                    f = ev => { F( D, e, ev, IT ? ev.changedTouches[ 0 ]: ev ); CH() }
                } else
                if ( E = /([\w_$]+)?(\((.+)\))?/.exec( v ) ) {
                    
                    const I = E[ 1 ] || n
                    const A = E[ 3 ] && C( '[' + E[ 3 ] + ']', a, 'el,ev,pos' )

                    f = ev => { FN[ I ].apply( e, A && A( D, e, ev, IT ? ev.changedTouches[ 0 ]: ev ) ) !== null && CH() }
                }
                
                e.addEventListener( N, f )
            } else
            if ( n[ 0 ] === ':' ) B( [ e ], AA, a, v, e, n.slice( 1 ), false ); else
            if ( n[ 1 ] === ':' ) B( [ e ], AA, a, v, e, n.slice( 2 ), true  );
            else return

            e.removeAttribute( n )
        } );
    }

    function P ( e, p ) {
        switch ( e.nodeType ) {
            case 3: return T( e, p )
            case 1:
                e.id && ( I[ e.id ] = e )
                if ( F( e, p ) ) return
                A( e, p )
        }
    
        var n = e.firstChild; while ( e = n ) { n = e.nextSibling; P( e, p ); }
    }
    
    function CH ( e ) {

        for ( var j = 0; j < S.length; j++ ) {
            const i = S[ j ];
            if ( i.is ) {
                const v = i.F( D )

                if ( !( 'v' in i ) || !EQ( i.v, v ) ) {
                    i.v = CL( v ); i.f( v, ...i.a )
                }
            }
        }

        return U
    }

    U.check = CH
    U.func = function ( id, fn ) {
        if ( typeof id === 'object' ) {
            for ( var k in id ) FN[ k ] = id[ k ]
        }
        else FN[ id ] = fn
    }
    U.bind = function ( code, func ) {
        B( [U], func, {}, code )
    }

    P( e, {} )

    return U
}