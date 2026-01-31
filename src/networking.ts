// import Peer from 'peerjs';
//
// export let peer = new Peer();
//
// let connectToId = null;
// if (window.location.search.length > 0) {
//     connectToId = new URLSearchParams(window.location.search).get('connectToId');
//
//     // clear url
//     const url = new URL(window.location.href);
//     url.search = ''
//     window.history.pushState(null, '', url.toString());
// }
//
// export function copyShareUrl() {
//     const shareUrl = new URL(document.URL);
//     shareUrl.search = '';
//     shareUrl.searchParams.append('connectToId', peer.id);
//
//     navigator.clipboard.writeText(shareUrl.toString()).then(function () {
//         alert('Copied ID to clipboard. Share this link with your friends to play!');
//     }).catch(function (err) {
//         console.error('Async: Could not copy text: ', err);
//         alert('Failed to copy text.');
//     });
// }
//
// peer.on('open', id => {
//     console.log('my peer id', id);
//
//     if (connectToId !== null) {
//         console.log("connectToId", connectToId);
//
//         let conn = peer.connect(connectToId);
//         conn.on('open', () => {
//             // Receive messages
//             conn.on('data', data => {
//                 console.log('received', data);
//             });
//
//             // Send messages
//             conn.send('Hello I am ' + peer.id);
//         });
//     }
// });
//
// peer.on('connection', conn => {
//     // Receive connection
//     conn.on('data', data => {
//         console.log('received', data);
//     });
//
//     conn.on('open', () => {
//         console.log('connection opened');
//         // Send messages
//         conn.send('Hello I am ' + peer.id);
//     });
// });
