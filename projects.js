const projectDefs = {

    'pxn': {

        contractAddress: '0x160c404b2b49cbc3240055ceaee026df1e8497a0',

        mintFunctions: {
            '0x4bc0a305': ['mintWL'           , 'Whitelist'],
            '0x59287fab': ['mintDutchAuction' , 'Dutch Auction'],
            '0x7b671780': ['teamMint'         , 'Team Members'],
            '0x7c69e207': ['devMint'          , 'Treasury']
        },

        getNumberMinted: (methodId, input) => {
            return methodId == '0x4bc0a305' ? 1 :
                   methodId == '0x59287fab' ||
                   methodId == '0x7b671780' ? parseInt(input.substring(10, 74), 16) :
                   methodId == '0x7c69e207' ? 129 :
                   NaN;
        },

    },

    'bayc': {

        contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',

        mintFunctions: {
            '0xa723533e': ['mintApe'     , 'Ape Mint'],
            '0xb0f67427': ['reserveApes' , 'Reserve Apes'],
        },

        getNumberMinted: (methodId, input) => {
            return methodId == '0xa723533e' ? parseInt(input.substring(10, 74), 16) :
                   methodId == '0xb0f67427' ? 30 :
                   NaN;
        },
    },

    // TODO: MAYC not quite working yet... 19343 detected mints out of 19430
    'mayc': {

        contractAddress: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',

        mintFunctions: {
            '0xc15e24bc': ['mintMutants'        , 'Mint Mutants'],
            '0xe73a9a25': ['mutateApeWithSerum' , 'Mutate Ape With Serum'],
        },

        getNumberMinted: (methodId, input) => {
            return methodId == '0xc15e24bc' ? parseInt(input.substring(10, 74), 16) :
                   methodId == '0xe73a9a25' ? 1 :
                   NaN;
        },
    }

}

const projects = (projectName) => projectDefs[projectName];

export { projects };
