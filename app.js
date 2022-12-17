"use strict";

import { get          } from 'https';
import { argv         } from 'process';
import { writeFile,
         readFileSync } from 'fs';
import { projects     } from './projects.js';

const myArgs = argv.slice(2);
const projectName = myArgs[0]
const project = projects[projectName];

const showError = (err) => {
    if (err) console.log(err);
}

//-----------------------------
// Ethereum historical prices
//-----------------------------

const ethPricesRaw  = readFileSync('data/eth_usd.csv', 'utf-8');
const ethPricesRows = ethPricesRaw.split(/\r\n|\n\r|\n|\r/).filter((x,i) => i>0 && x.length>0);

const ethPrices = ethPricesRows.reduce((result, row) => {
    const rowItems = row.split(',');
    const dateYMD  = rowItems[0].split('-');
    const year     = dateYMD[0];
    const month    = dateYMD[1] - 1; // January is 0
    const day      = dateYMD[2];

    const date  = new Date(year, month, day);
    const price = rowItems[5];
    return ({...result, [date]: parseFloat(price)})

}, {});

const getEthPrice = (date) => {
    const year  = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day   = date.getUTCDate();

    return ethPrices[new Date(year, month, day)];
};


//-----------------------------
// Download
//-----------------------------

//
// https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-erc721-token-transfer-events-by-address
//
// tokennfttx: ERC721 transfers that come from 0x0000000000000000000000000000000000000000 are mints
//
const tokennfttxUrl = 'https://api.etherscan.io/api?module=account&action=tokennfttx&address=0x0000000000000000000000000000000000000000&contractaddress=';

//
// https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-normal-transactions-by-address
//
// txlist: If the address queried is a contract address, this returns all transactions under that contract
//
const txlistUrl     = 'https://api.etherscan.io/api?module=account&action=txlist&address=';

const urls  = [tokennfttxUrl + project.contractAddresses[0] + '&startblock=']
            .concat(project.contractAddresses.map(x => txlistUrl + x + '&startblock='))

const download = async (urls, _transfers, _transactions, _currentUrlIdx, _currentContent) => {

    const currentUrlIdx = _currentUrlIdx !== undefined ? _currentUrlIdx : 0;
    const transfers     = _transfers     !== undefined ? _transfers     : [];
    const transactions  = _transactions  !== undefined ? _transactions  : [];

    // Process each URL in the array
    if (currentUrlIdx < urls.length) {

        const url = urls[currentUrlIdx];

        // Extract dataset name from URL: 'txlist' or 'tokennfttx'
        const dataSet = url.split('action=')[1].split('&')[0];

        // Each request only returns 10000 records, so we need to fetch several times
        // for the same dataset. currentContent and currentBlock keeps track.
        const currentContent = _currentContent !== undefined ? _currentContent : [];
        const currentBlock   = currentContent.length == 0 ? 0 :
                                Math.max(...currentContent.map(x => x['blockNumber']));

        // Etherscan free tier API is restricted to 1 request per 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        get(url + currentBlock, (response) => {
            const chunks = [];
            response
                .on('data', (chunk) => chunks.push(chunk))
                .on('end', () => {

                    const content        = JSON.parse(chunks.join(''))['result'];
                    const updatedContent = currentContent.concat(content);

                    console.log(updatedContent.length + ' records retrieved from [' + currentUrlIdx + '] \'' + dataSet + '\'' );

                    // If we receive 10000 records, we can assume there's more left
                    // Adjust currentContent and currentBlock, and download the next page
                    if (content.length >= 10000) {
                        download(urls, transfers, transactions, currentUrlIdx, updatedContent);
                    }
                    // If it's less that 10000 records, that's the last page of the dataset
                    // Store what we have so far in updatedTransfers and updatedTransactions
                    // and then move the URL index to the next one
                    else {
                        const updatedTransfers    = dataSet == 'tokennfttx' ? transfers.concat(updatedContent)    : transfers;
                        const updatedTransactions = dataSet == 'txlist'     ? transactions.concat(updatedContent) : transactions;
                        download(urls, updatedTransfers, updatedTransactions, currentUrlIdx + 1);
                    }
                });
        });
    }
    else {
        // All downloads done; proceed to process
        process(transfers, transactions);
    }
}


//-----------------------------
// Process raw datasets
//-----------------------------

const process = (allTransfers, allTransactions) => {

    // The downloaded data can contain duplicate records because of
    // how we download from Etherscan. We filter them out here
    const uniqueMints = allTransfers.filter((x, i, a) => a.findIndex((y) => y['tokenID'] == x['tokenID']) == i);

    // Construct an object containing mint information per token
    // Use data from both transfers and transactions
    const tokenData = uniqueMints.map(thisTransfer => {

        // Look for the record in the transactions object with the
        // same transaction hash as the current mint record
        const thisTransaction = allTransactions.find(x => x['isError'] == 0 && x['hash'] == thisTransfer['hash']);

        // If the transaction record was not found, it was ran using another
        // contract, like a proxy or wrapper. Notify the user, and error out
        if (thisTransaction === undefined) {
            throw new Error('The contract used in transaction: ' + thisTransfer['hash'] + ' needs to be added to projects.js');
        }

        const thisTokenData = {
            // common
            'blockNumber'       : thisTransfer['blockNumber'],
            'timeStamp'         : thisTransfer['timeStamp'],
            'hash'              : thisTransfer['hash'],
            'nonce'             : thisTransfer['nonce'],
            'blockHash'         : thisTransfer['blockHash'],
            'transactionIndex'  : thisTransfer['transactionIndex'],
            'gas'               : thisTransfer['gas'],
            'gasPrice'          : thisTransfer['gasPrice'],
            'gasUsed'           : thisTransfer['gasUsed'],
            'cumulativeGasUsed' : thisTransfer['cumulativeGasUsed'],

            // mints dataset
            'tokenID'           : thisTransfer['tokenID'],
            'tokenName'         : thisTransfer['tokenName'],
            'tokenSymbol'       : thisTransfer['tokenSymbol'],
            'tokenDecimal'      : thisTransfer['tokenDecimal'],

            // transactions dataset
            'value'             : thisTransaction['value'],
            'isError'           : thisTransaction['isError'],
            'txreceipt_status'  : thisTransaction['txreceipt_status'],
            'methodId'          : thisTransaction['methodId'],
            'functionName'      : thisTransaction['functionName'],

            // mints (collisions)
            // 'from'
            // 'input'
            'to'                : thisTransfer['to'],
            'contractAddress'   : thisTransfer['contractAddress'],

            // transactions (collisions)
            // 'from'
            // 'to'
            // 'contractAddress'
            'input'             : thisTransaction['input'],

            // unused
            // 'confirmations'
        };
        return thisTokenData;

    });

    const uniqueMintTransactions = tokenData.map((tokenMint, tokenMintIdx) => [tokenMintIdx, tokenMint['hash']]).filter((x, i, a) => a.findIndex(y => y[1] == x[1]) == i);



    // console.log(uniqueMintTransactions.length + ' unique mint transactions');
    // console.log('mint functions:');
    // console.log(uniqueFunctions);

    const mintTransactions = uniqueMintTransactions.map(tx => {

        // common
        const blockNumber       = tokenData[tx[0]]['blockNumber'];
        const timeStamp         = tokenData[tx[0]]['timeStamp'];
        const hash              = tokenData[tx[0]]['hash'];
        const nonce             = tokenData[tx[0]]['nonce'];
        const blockHash         = tokenData[tx[0]]['blockHash'];
        const transactionIndex  = tokenData[tx[0]]['transactionIndex'];
        const gas               = tokenData[tx[0]]['gas'];
        const gasPrice          = tokenData[tx[0]]['gasPrice'];
        const gasUsed           = tokenData[tx[0]]['gasUsed'];
        const cumulativeGasUsed = tokenData[tx[0]]['cumulativeGasUsed'];

        // mints dataset
        const contractAddress   = tokenData[tx[0]]['contractAddress'];
        const to                = tokenData[tx[0]]['to'];
        const tokenName         = tokenData[tx[0]]['tokenName'];
        const tokenSymbol       = tokenData[tx[0]]['tokenSymbol'];
        const tokenDecimal      = tokenData[tx[0]]['tokenDecimal'];

        // transactions dataset
        const value             = tokenData[tx[0]]['value'];
        const isError           = tokenData[tx[0]]['isError'];
        const txreceipt_status  = tokenData[tx[0]]['txreceipt_status'];
        const methodId          = tokenData[tx[0]]['methodId'];
        const functionSignature = tokenData[tx[0]]['functionName'];

        // derived
        const functionName = functionSignature.split('(')[0];

        const tokenIDs = tokenData.reduce((acc, val) => val['hash'] == tx[1] ? acc.concat(val['tokenID']) : acc, []);
        const tokenIDsString = tokenIDs.join(' ');
        const tokenCount = tokenIDs.length;

        const isoDate = new Date(parseInt(timeStamp) * 1000);
        const date = isoDate.toLocaleDateString('en-us', { year: 'numeric', month: 'numeric', day: 'numeric'});

        const priceETHUSD   = getEthPrice(isoDate);
        const valueETH      = parseFloat(value) / 1000000000000000000.0;
        const tokenValueETH = valueETH / tokenCount;
        const tokenValueUSD = tokenValueETH * priceETHUSD;

        const gasUsedETH    = parseFloat(gasUsed) * parseFloat(gasPrice) / 1000000000000000000.0;
        const gasUsedUSD    = gasUsedETH * priceETHUSD;

        const mintTransaction = {

            // transaction
            'transactionHash'   : hash,
            'minterAddress'     : to,
            'functionName'      : functionName,
            'date'              : date,

            // costs
            'priceETHUSD'       : Math.round(priceETHUSD * 100.0) / 100.0,
            'totalValue'        : Math.round(valueETH * 100000000.0) / 100000000.0,
            'tokenValueETH'     : Math.round(tokenValueETH * 100000000.0) / 100000000.0,
            'tokenValueUSD'     : Math.round(tokenValueUSD * 100.0) / 100.0,

            // gas
            'gasUsedETH'        : Math.round(gasUsedETH * 100000000.0) / 100000000.0,
            'gasUsedUSD'        : Math.round(gasUsedUSD * 100.0) / 100.0,

            // informational
            'tokenName'         : tokenName,
            'tokenSymbol'       : tokenSymbol,
            'tokenDecimal'      : tokenDecimal,
            'contractAddress'   : contractAddress,

            // stats for nerds
            'blockNumber'       : blockNumber,
            'blockHash'         : blockHash,
            'nonce'             : nonce,
            'transactionIndex'  : transactionIndex,
            'methodId'          : methodId,
            'value'             : value,
            'gasPrice'          : gasPrice,
            'gas'               : gas,
            'gasUsed'           : gasUsed,
            'cumulativeGasUsed' : cumulativeGasUsed,
            'isError'           : isError,
            'txReceiptStatus'   : txreceipt_status,
            'timeStamp'         : timeStamp,
            'isoDate'           : isoDate,
            'txTokenCount'      : tokenCount,
            'txTokenIDs'        : tokenIDsString

        };

        return mintTransaction;
    });

    const mintItems = mintTransactions.reduce((result, transaction) => {

        // duplicate the transaction's entry for each token ID it minted
        const expansion = transaction['txTokenIDs'].split(' ').reduce((acc, id) => {

            return acc.concat([{['tokenID']: id, ...transaction}]);

        }, []);

        return result.concat(expansion);

    }, []);





    const mintItemsCSV = mintItems.reduce((acc, txn) =>
        acc.concat([Object.values(txn).map(x => '"' + x + '"').join(',')]),
        [Object.keys(mintItems[0]).map(x => '"' + x + '"').join(',')]);

    writeFile('data/' + projectName + '_tokens.csv', mintItemsCSV.join('\n'), showError);


    const uniqueFunctionsRaw = mintTransactions.map(txn => [txn['methodId'], txn['functionName']]).filter((x, i, a) => a.findIndex(y => y[0] == x[0]) == i);





    const itemsTotal = mintItems.length;

    const [ethTotal, usdTotal] =
        mintItems.reduce((acc, item) =>
        [
            parseFloat(acc[0]) + item['tokenValueETH'],
            parseFloat(acc[1]) + item['tokenValueUSD'],
        ],
        [0.0, 0.0]);

    //console.log([itemsTotal, ethTotal, usdTotal]);

    const functionStats = uniqueFunctionsRaw.map(x => {

        const [methodId, functionName] = x;


        // 'priceETHUSD'       : Math.round(priceETHUSD * 100.0) / 100.0,
        // 'totalValue'        : Math.round(valueETH * 100000000.0) / 100000000.0,


        const [
            itemsPerFunction,
            totalETH,
            totalUSD,
            totalGasETH,
            totalGasUSD
        ] =
            mintItems.reduce((acc, item) =>
            item['methodId'] == methodId ? [
                parseInt(acc[0]) + 1,
                parseFloat(acc[1]) + Math.round(item['tokenValueETH'] * 100000000.0) / 100000000.0,
                parseFloat(acc[2]) + Math.round(item['tokenValueUSD'] * 100.0) / 100.0,
                parseFloat(acc[3]) + Math.round(item['gasUsedETH'] * 100000000.0) / 100000000.0,
                parseFloat(acc[4]) + Math.round(item['gasUsedUSD'] * 100.0) / 100.0
            ] :
            [
                parseInt(acc[0]),
                parseFloat(acc[1]),
                parseFloat(acc[2]),
                parseFloat(acc[3]),
                parseFloat(acc[4])
            ],
            [0, 0.0, 0.0, 0.0, 0.0]);

        return {
            'functionName'  : functionName,
            'methodId'      : methodId,
            'items'         : itemsPerFunction,
            'totalETH'      : Math.round(totalETH * 100000000.0) / 100000000.0,
            'totalUSD'      : Math.round(totalUSD * 100.0) / 100.0,
            'averageETH'    : Math.round(totalETH / itemsPerFunction * 100000000.0) / 100000000.0,
            'averageUSD'    : Math.round(totalUSD / itemsPerFunction * 100.0) / 100.0,
            'totalGasETH'   : Math.round(totalGasETH * 100000000.0) / 100000000.0,
            'totalGasUSD'   : Math.round(totalGasUSD * 100.0) / 100.0,
            'averageGasETH' : Math.round(totalGasETH / itemsPerFunction * 100000000.0) / 100000000.0,
            'averageGasUSD' : Math.round(totalGasUSD / itemsPerFunction * 100.0) / 100.0
        }

    });


    const functionsCSV = functionStats.reduce((acc, txn) =>
        acc.concat([Object.values(txn).map(x => '"' + x + '"').join(',')]),
        [Object.keys(functionStats[0]).map(x => '"' + x + '"').join(',')]);

    writeFile('data/' + projectName + '_functions.csv', functionsCSV.join('\n'), showError);
    //console.log(functionStats);


    console.log();









    // writeFile('data/' + projectName + '_mints_ids.json', JSON.stringify(mintItems), showError);
    // writeFile('data/' + projectName + '_mints_tx.json', JSON.stringify(mintTransactions), showError);
    // writeFile('data/' + projectName + '_mints.json', JSON.stringify(tokenData), showError);
    // writeFile('data/' + projectName + '_transfers.json', JSON.stringify(uniqueTokenTransfers), showError);
}





//-----------------------------
// Start the program
//-----------------------------
const start = () => download(urls);
start();
