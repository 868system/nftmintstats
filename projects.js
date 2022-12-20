const projects = {

    // Cryptopunks
    // Predates ERC721 and can't be processed
    // 'cryptopunks'       : {contractAddresses: [ '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb'    ]},

    // Bored Ape Yacht Club
    'bayc'              : {contractAddresses: [ '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'    ]},

    // Mutant Ape Yacht Club
    'mayc'              : {contractAddresses: [ '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
                                                '0xa7ab7a265f274fa664187698932d3cabb851023d',
                                                '0x22810e61ddd7df3dcb87dbbffe8f22811806145e',
                                                '0xb88f61e6fbda83fbfffabe364112137480398018',
                                                '0x0dd46d3cab80d4eec9298fbae9cc6c27edd969c0',
                                                '0xdbfd76af2157dc15ee4e57f3f942bb45ba84af24'    ]},

    // Otherdeed for Otherside
    // RangeError: Maximum call stack size exceeded
    // 'othr'              : {contractAddresses: [ '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258'    ]},

    // Azuki
    'azuki'             : {contractAddresses: [ '0xED5AF388653567Af2F388E6224dC7C4b3241C544'    ]},

    // CloneX
    'clonex'            : {contractAddresses: [ '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
                                                '0x348fc118bcc65a92dc033a951af153d14d945312'    ]},

    // Moonbirds
    'moonbird'          : {contractAddresses: [ '0x23581767a106ae21c074b2276D25e5C3e136a68b',
                                                '0x0539c622062567564f157a9885bede7e1c1fb296'    ]},

    // Sandbox
    // Polygon NFTs can't be processed
    // 'land'              : {contractAddresses: [ '0x9d305a42A3975Ee4c1C57555BeD5919889DCE63F'    ]},

    // Doodles
    'doodle'            : {contractAddresses: [ '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
                                                '0x5a019874f4fae314b0eaa4606be746366e661306',
                                                '0xab1abe738b1624b39170f31ac0a4a2adca3cdb59',
                                                '0xa9634c7afcf92bd9abd93e80d91598905e79396c'    ]},

    // Meebits
    'meebits'           : {contractAddresses: [ '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
                                                '0xbc49de68bcbd164574847a7ced47e7475179c76b',
                                                '0x10a0847c2d170008ddca7c3a688124f493630032',
                                                '0xba585c9b7a89fa59233701cfc6f1552bf032b18b',
                                                '0x7fdc01ff064216493e7c695aba46dcd4ecc376ae',
                                                '0x270ff2308a29099744230de56e7b41c8ced46ffb'    ]},

    // Cool Cats
    'cool'              : {contractAddresses: [ '0x1A92f7381B9F03921564a437210bB9396471050C'    ]},

    // Bored Ape Kennel Club
    'bakc'              : {contractAddresses: [ '0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623',
                                                '0xf64a03c45ef0d127d4766fe96ac421fc98d78f79',
                                                '0xb88f61e6fbda83fbfffabe364112137480398018'    ]},

    // Decentraland
    'land'              : {contractAddresses: [ '0xF87E31492Faf9A91B02Ee0dEAAd50d51d56D5d4d',
                                                '0x54b7a124b44054da3692dbc56b116a35c6a3e561'    ]},

    // Pudgy Penguins
    'ppg'               : {contractAddresses: [ '0xbd3531da5cf5857e7cfaa92426877b022e612cf8'    ]},

    // Potatoz
    'potatoz'           : {contractAddresses: [ '0x39ee2c7b3cb80254225884ca001F57118C8f21B6'    ]},

    // Degen Toonz
    'toonz'             : {contractAddresses: [ '0x19b86299c21505cdf59cE63740B240A9C822b5E4'    ]},

    // Invisible Friends
    'invsble'           : {contractAddresses: [ '0x59468516a8259058baD1cA5F8f4BFF190d30E066'    ]},

    // Rektguy
    // RangeError: Maximum call stack size exceeded
    // 'rektguy'           : {contractAddresses: [ '0xB852c6b5892256C264Cc2C888eA462189154D8d7',
    //                                             '0x9ecab5e0f33176f75d6ff3ee004eaf6474e7b4bc',
    //                                             '0x9d58779365b067d5d3fcc6e92d237acd06f1e6a1'    ]},

    // Genuine Undead
    'gu'                : {contractAddresses: [ '0x209e639a0EC166Ac7a1A4bA41968fa967dB30221'    ]},

    // Fluf World
    'fluf'              : {contractAddresses: [ '0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d'    ]},

    // Beanz
    // RangeError: Maximum call stack size exceeded
    // 'beanz'             : {contractAddresses: [ '0x306b1ea3ecdf94aB739F1910bbda052Ed4A9f949',
    //                                             '0x02f3ebd01e3b02019573a9c3b19e5db804cf640d',
    //                                             '0x0bd30c34e4524df28d368d00c2feb534696d0bb7',
    //                                             '0x281f78188f494260edea1718bfb0eaceb0f7e79e',
    //                                             '0x312871bafc1c630be270829b5fb45626189505fd',
    //                                             '0x8093c39d69b33ef7384f9bb03dff50113ef6466e',
    //                                             '0x9d58779365b067d5d3fcc6e92d237acd06f1e6a1',
    //                                             '0xa9f587b8c268201575556941addc2b671b59aa05',
    //                                             '0xd01a46404e3af36a0936f48db312c5e6bb5b06d2',
    //                                             '0xd38a87d7b690323ef6883e887614502abcf9b1eb',
    //                                             '0xecd3054ab5552035276624bc94e2d7a147f3fc81',
    //                                             '0xf7478497c8d6dd17db3e66cc956eac032498d5cf'    ]},

    // mfers
    'mfer'              : {contractAddresses: [ '0x79fcdef22feed20eddacbb2587640e45491b757f'    ]},

    // Sappy Seals
    'saps'              : {contractAddresses: [ '0x364C828eE171616a39897688A831c2499aD972ec'    ]},

    // Cold Blooded Creepz
    'cbc'               : {contractAddresses: [ '0xfE8C6d19365453D26af321D0e8c910428c23873F'    ]},

    // Bulls and Apes Project - Genesis
    'bapbull'           : {contractAddresses: [ '0x2Cf6BE9AaC1c7630d5A23af88c28275C70eb8819',
                                                '0xe84da4132f533853d599835e297b3dc3aaf3cdf0',
                                                '0x31e8d14a96f43cf4444533c7b0ee3beecc889400',
                                                '0x267f73c996b501af83d7989ea7f4df859d9656b2',
                                                '0xa4e40785f03103215ffe03e707f7c2f4d78643ba',
                                                '0x4afd163f281ed126cb07eaf99f52d8a083e135e3'    ]},

    // Kanpai Pandas
    'ykps'              : {contractAddresses: [ '0xaCF63E56fd08970b43401492a02F6F38B6635C91',
                                                '0x902f09715b6303d4173037652fa7377e5b98089e',
                                                '0xcb566e3b6934fa77258d68ea18e931fa75e1aaaa'    ]},

    // VeeFriends
    'vft'               : {contractAddresses: [ '0xa3AEe8BcE55BEeA1951EF834b99f3Ac60d1ABeeB',
                                                '0x7654cefb707c26d013039d389127d597ca7c382b',
                                                '0x01958b5845685de454e016470e7200511eabd152'    ]},

    // Rare Apepe Yacht Club
    'rayc'              : {contractAddresses: [ '0x31d45de84fdE2fB36575085e05754a4932DD5170'    ]},


    // PxN: Ghost Division
    'pxn'               : {contractAddresses: [ '0x160c404b2b49cbc3240055ceaee026df1e8497a0'    ]},

    // Quirkies
    'qrks'              : {contractAddresses: [ '0x3903d4ffaaa700b62578a66e7a67ba4cb67787f9'    ]},

    // Chimpers
    'chmp'              : {contractAddresses: [ '0x80336Ad7A747236ef41F47ed2C7641828a480BAA'    ]},

    // World of Women
    'wow'               : {contractAddresses: [ '0xe785E82358879F061BC3dcAC6f0444462D4b5330'    ]},

    // goblintown.wtf
    'goblin'            : {contractAddresses: [ '0xbCe3781ae7Ca1a5e050Bd9C4c77369867eBc307e'    ]},

    // Moonbirds Oddities
    'oddities'          : {contractAddresses: [ '0x1792a96E5668ad7C167ab804a100ce42395Ce54D'    ]},

    // Murakami Flowers
    // RangeError: Maximum call stack size exceeded
    // 'mf'                : {contractAddresses: [ '0x7D8820FA92EB1584636f4F5b8515B5476B75171a',
    //                                             '0xb88f61e6fbda83fbfffabe364112137480398018',
    //                                             '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
    //                                             '0x9ddbdcd3c5123e673e4b96992101f8ceafcd95a0',
    //                                             '0x9d58779365b067d5d3fcc6e92d237acd06f1e6a1'    ]},

    // VeeFriends Series 2
    'vf2'               : {contractAddresses: [ '0x9378368ba6b85c1FbA5b131b530f5F5bEdf21A18'    ]},

    // Gutter Cat Gang
    // This is ERC1155... skip for now
    // 'guttercat'         : {contractAddresses: [ '0xEdB61f74B0d09B2558F1eeb79B247c1F363Ae452'    ]},

    // DeadFellaz
    'deadfellaz'        : {contractAddresses: [ '0x2acAb3DEa77832C09420663b0E1cB386031bA17B'    ]},

    // Crypto Walkers Females
    'cwf'               : {contractAddresses: [ '0xC3cE480376A6340e0A4CDd3E4843BDC0bc765a45'    ]},

    // Hydro Whales Mining Club
    'hwmc'              : {contractAddresses: [ '0xba72b008D53D3E65f6641e1D63376Be2F9C1aD05'    ]},

    // Digital Tycoons Club
    'tykes'             : {contractAddresses: [ '0x0E32cEE0445413e118b14d02E0409303D338487a'    ]},

    // Milady Maker
    'mil'               : {contractAddresses: [ '0x5Af0D9827E0c53E4799BB226655A1de152A425a5'    ]},

    // Meta Bounty Hunters
    'mbh'               : {contractAddresses: [ '0xFC2068C3D47b575A60F6A4a7Bf60DEA0Ac368e01'    ]},

    // Mekaverse
    'meka'              : {contractAddresses: [ '0x9A534628B4062E123cE7Ee2222ec20B86e16Ca8F'    ]},

    // Lazy Lions
    'lion'              : {contractAddresses: [ '0x8943C7bAC1914C9A7ABa750Bf2B6B09Fd21037E0'    ]},

    // Cyberbrokers
    'cyberbrokers'      : {contractAddresses: [ '0x892848074ddeA461A15f337250Da3ce55580CA85',
                                                '0xd64291d842212bcf20db9dbece7823fe103061ab',
                                                '0xfbd39230f72ec7610828742a787b603cac7b5ee2'    ]},

    // Alien Frens
    'alienfrens'        : {contractAddresses: [ '0x123b30E25973FeCd8354dd5f41Cc45A3065eF88C'    ]},

    // Cryptoadz
    'toadz'             : {contractAddresses: [ '0x1CB1A5e65610AEFF2551A50f76a87a7d3fB649C6'    ]},

    // Kaiju Kingz
    'kaiju'             : {contractAddresses: [ '0x0c2E57EFddbA8c768147D1fdF9176a0A6EBd5d83',
                                                '0xb10f56fa353d99436ca9dc0b7f6a950232fd6ca9'    ]},

}

export { projects };
