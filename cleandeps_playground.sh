#!/bin/sh

LIST="express body-parser exceljs puppeteer @fast-csv/format @fast-csv/parse"
for i in $LIST; do
    rm -rf node_modules/$i
done
