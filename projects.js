const projectDefs = {

    'pxn': {

        contractAddresses: ['0x160c404b2b49cbc3240055ceaee026df1e8497a0'],

        mintFunctions: {
            '0x4bc0a305': ['mintWL'           , 'Whitelist'],
            '0x59287fab': ['mintDutchAuction' , 'Dutch Auction'],
            '0x7b671780': ['teamMint'         , 'Team Members'],
            '0x7c69e207': ['devMint'          , 'Treasury']
        },

        getNumberMinted: (methodId, input) => {
            return  methodId == '0x4bc0a305' ? 1 :
                    methodId == '0x59287fab' ||
                    methodId == '0x7b671780' ? parseInt(input.substring(10, 74), 16) :
                    methodId == '0x7c69e207' ? 129 :
                    NaN;
        },

    },

    'bayc': {

        contractAddresses: ['0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'],

        mintFunctions: {
            '0xa723533e': ['mintApe'     , 'Ape Mint'],
            '0xb0f67427': ['reserveApes' , 'Reserve Apes'],
        },

        getNumberMinted: (methodId, input) => {
            return  methodId == '0xa723533e' ? parseInt(input.substring(10, 74), 16) :
                    methodId == '0xb0f67427' ? 30 :
                    NaN;
        },
    },

    // TODO: MAYC not quite working yet... 19343 detected mints out of 19430
    'mayc': {

        contractAddresses: [
            '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
            '0xa7ab7a265f274fa664187698932d3cabb851023d',
            '0x22810e61ddd7df3dcb87dbbffe8f22811806145e',
            '0xb88f61e6fbda83fbfffabe364112137480398018',
            '0x0dd46d3cab80d4eec9298fbae9cc6c27edd969c0',
            '0xdbfd76af2157dc15ee4e57f3f942bb45ba84af24'
        ],

        mintFunctions: {
            '0xc15e24bc': ['mintMutants'        , 'Mint Mutants'],
            '0xe73a9a25': ['mutateApeWithSerum' , 'Mutate Ape With Serum'],
            '0x6a761202': ['execTransaction'    , 'Gnosis Safe Proxy']
        },

        getNumberMinted: (methodId, input) => {
            return  methodId == '0xc15e24bc' ? parseInt(input.substring(10, 74), 16) :
                    methodId == '0xe73a9a25' ? 1 :
                    methodId == '0x6a761202' &&
                        input.substring(34, 74).toLowerCase() == '60e4d786628fea6478f785a6d7e704777c86a7c6' &&
                        input.substring(714, 722) == 'c15e24bc' ? parseInt(input.substring(722, 786), 16) :
                    methodId == '0x6a761202' &&
                        input.substring(34, 74).toLowerCase() == '60e4d786628fea6478f785a6d7e704777c86a7c6' &&
                        input.substring(714, 722) == 'e73a9a25' ? 1 :
                    methodId == '0x6a761202' ? 0 :
                    NaN;
        },
    }

}

const projects = (projectName) => projectDefs[projectName];

export { projects };
