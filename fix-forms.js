const fs = require('fs');
let cms = fs.readFileSync('patch-temp.js', 'utf8');

// We have two identical `<form id="product-form"` due to global replace.
// The first is ProductForm, the second is ScentForm.
let parts = cms.split('<form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">');
if (parts.length === 3) {
  cms = parts[0] + 
        '<form id="product-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">' + 
        parts[1] + 
        '<form id="scent-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">' + 
        parts[2];
}

fs.writeFileSync('patch-temp2.js', cms);
