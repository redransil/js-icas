// Assumes argument is simply a CID, and does not parse the object it returns
this.loadCID = async function(arg, ipfsnode){

    // The argument must be a string
    if (!((typeof arg) == 'string')) {return {"r": false, "errors":["CID was not a string"]}}

    // Can't load anything if no node
    if (ipfsnode === null) {return {"r": false, "errors":["loadCID received no IPFSnode"]}}

    // Load content using the CID
    try{
        const stream = ipfsnode.cat(arg)
        let retrieved = ''
        for await(const chunk of stream) {
            retrieved += chunk.toString()
        }
        return {"r": true, "errors":[], "data": retrieved}
    }
    catch{
        return {"r": false, "errors":[`could not retrieve CID: ${arg}`]}
    }
}


this.resolveString = async function(arg, ipfsnode) {
  if (!((typeof arg) == 'string')) {
    return {"r": false, "errors":['not a string'], "data":arg}
  }

  // Attempt to parse as JSON
  parsedResult = null
  try{
    parsedResult = JSON.parse(arg)
    // This may result in an error, an object, or a string (if double-stringified)
    if ((typeof parsedResult) == 'string'){return await this.resolveString(parsedResult, ipfsnode)}
    else {return {"r": true, "errors":[], "data":parsedResult}}
  }
  catch{isJSON = false}

  // If we've gotten here, it's a string and it's not JSON
  if (ipfsnode == null){
    return {"r": false, "errors":['no IPFS node'], "data":arg}
  }
  else {
    ipfsResult = await this.loadCID(arg, ipfsnode)

    // IFPS may return good data, or return undefined if can't find this string as a CID
    // It's a string but not a CID, so return it
    if (ipfsResult.data == undefined) {return {"r": true, "errors":[], "data":arg}}
    if (ipfsResult.data == null) {return {"r": true, "errors":[], "data":arg}}
    if (ipfsResult.r == false) {return {"r": true, "errors":[], "data":arg}}

    // If we got ipfs data, it may be JSON (or a CID) so resolve recursively

    recursiveResult = await this.resolveString(ipfsResult.data, ipfsnode)
    if (recursiveResult.r){return recursiveResult}
    else {return ipfsResult}
  }
}

// Takes an ICAS function and evaluates it
this.eval = async function(icasFunction, icasContent, ipfsnode) {

  // Find the executable we are looking for
  // If can't find it, return that something is wrong with the function
  parsedFunction = await this.resolveString(icasFunction, ipfsnode)
  if (!(parsedFunction.r)){return {"r": false, "errors":parsedFunction.errors, "data":null}}
  exec = null
  try{exec = parsedFunction.data.exec}
  catch{return {"r": false, "errors":['could not find function exec'], "data":null}}

  // Try finding the exec code and the format. If can't find, return something wrong with exec
  parsedExec = await this.resolveString(exec, ipfsnode)
  if (!(parsedExec.r)){return {"r": false, "errors":parsedExec.errors, "data":null}}
  execFormat = parsedExec.data.format
  if(execFormat == 'undefined'){return {"r": false, "errors":['could not find exec format'], "data":null}}
  execCode = parsedExec.data.CID
  if (execCode == 'undefined'){return {"r": false, "errors":['could not find exec code'], "data":null}}

  // If the format isn't supported, return that
  if (!(execFormat == 'ECMAScript 2018')){return {"r": false, "errors":[`unsupported format ${execFormat}`], "data":null}}

  // Find the code with parse string
  // Don't see whether the content matches the Function content for now
  parsedCode = await this.resolveString(execCode, ipfsnode)
  if (!(parsedCode.r)){return {"r": false, "errors":parsedCode.errors, "data":null}}

  // Get the input address
  parsedInput = await this.resolveString(icasContent, ipfsnode)
  if (!(parsedInput.r)){return {"r": false, "errors":parsedInput.errors, "data":null}}
  inputPayload = parsedInput.data.CID
  if(inputPayload == 'undefined'){return {"r": false, "errors":['could not find input payload'], "data":null}}

  // Load the input
  parsedData = await this.resolveString(parsedInput.data.CID, ipfsnode)
  if (!(parsedData.r)){return {"r": false, "errors":parsedData.errors, "data":null}}

  // Make sure input payload is a supported format
  inputFormat = parsedInput.data.format
  if(inputFormat=='undefined'){return {"r": false, "errors":['could not find input format'], "data":null}}
  if(!(inputFormat=='https://json-schema.org/draft/2019-09/schema')){
    return {"r": false, "errors":['unsupported input format'], "data":null}
  }

  // Try instantiating the function and running on content payload. If fails return something wrong
  functionResult = null
  try{
    func = new Function('input', parsedCode.data)
    functionResult = func(parsedData.data)
    return {"r": true, "errors":[], "data":functionResult}
  }
  catch{
    return {"r": false, "errors":['could not run function on input'], "data":null}
  }
}
