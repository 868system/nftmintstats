# nftmintstats
Retrieves, parses, and computes NFT collections' original mint value and related statistics

Powered by Etherscan.io APIs
https://etherscan.io/apis

<br/>

## install and run

You need to have Node installed; no extra packages needed.

Clone this repository locally, and run in the project directory:

`npm start <project_name>`

or

`node app.js <project_name>`

Have a look at `projects.js` to see which NFT projects are currently supported.

<br/>

## sample execution

```
$ node app.js pxn
10000 records retrieved from [0] 'tokennfttx'
10129 records retrieved from [0] 'tokennfttx'
0 records retrieved from [1] 'token1155tx' (skipped)
10000 records retrieved from [2] 'txlist'
20000 records retrieved from [2] 'txlist'
30000 records retrieved from [2] 'txlist'
39657 records retrieved from [2] 'txlist'
```

Output files will reside in the `data` subdirectory.

<br/>

## adding a project

Open `projects.js` and add your project in this format. Specify the NFT's contract address.

```js
// PxN: Ghost Division
'pxn': {contractAddresses: [
    '0x160c404b2b49cbc3240055ceaee026df1e8497a0'
]},
```

Sometimes, the app will throw this error:

```
$ node app.js moonbird

...

0x93f220465b595882157b50c7268911073c1aa78d4949cd9d70627f38342ef5b5
file:///home/linux/projects/nftmintstats/app.js:217
        throw new Error('The contracts used in the transactions above need to be added to projects.js');
              ^

Error: The contracts used in the transactions above need to be added to projects.js
```

This is because some users minted their tokens using proxy contracts.

Go to Etherscan, find out the proxy contracts used for each listed transaction, and add to the `contractAddresses` array:

```js
    // Moonbirds
    'moonbird': {contractAddresses: [
        '0x23581767a106ae21c074b2276D25e5C3e136a68b',   // official contract
        '0x0539c622062567564f157a9885bede7e1c1fb296'    // proxy contract
    ]},
```

Make sure that the first entry in the array is the official token contract.

<br />

## limitations

This utility only supports ERC 721 NFTs on the Ethereum network.

~~Currently, ERC 1155 support is preliminary and will likely result in wrong data if the collection has several editions per token ID.~~

ERC 1155 support is on hold, in favor of developing more urgent features.
