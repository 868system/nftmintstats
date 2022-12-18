#!/bin/sh

# Sample use:
# ./run.sh bayc

# Data Source: CoinMarketCap via Yahoo! Finance
# https://finance.yahoo.com/quote/ETH-USD/history

wget 'https://query1.finance.yahoo.com/v7/finance/download/ETH-USD?period1=0&period2=10000000000&interval=1d&events=history&includeAdjustedClose=true' \
    --user-agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' \
    --quiet \
    --output-document='data/_eth_usd_.csv'

node ./app.js $1
