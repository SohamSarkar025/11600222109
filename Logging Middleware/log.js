async function Log(stack,level,pkg,message){
    const allowedStacks = ["backend","frontend"];
    const allowedLevels =["debug","info","warn","error","fatal"];

    const allowedBackendPackages = ["cache","controller","cron_job","db","domain","handler","repository","route","service"];

    const allowedFrontendPackages = ["api","component","hook"];
    const allowedSharedPackages = ["auth","config","middleware","utils","page","state","style"];

    //Validate level
    if(!allowedStacks.includes(stack)){
        return console.error(`Invalid stack: ${stack} Allowed: ${allowedSStacks.join(",")}`);
    }

    //Validate Package based on stack
    if(stack === "backend"){
        if(![...allowedBackendPackages,...allowedSharedPackages].includes(pkg)){
            return comnsole.error(`Invalid package for backend: ${pkg}. Allowed: ${[...allowedBackendPackages,...allowedSharedPackages].join(",")}`);

        }
    }

    //Build Log Entry
    const logEntry = {stack,level,package:pkg,message};
    try {
        const response = await fetch("http://20.244.56.144/evaluation-service/logs",{
            method:"POST",
            headers:{
                "Conetnt-Type":"application/json",
            },
            body:JSON.stringify(logEntry),
    });
        if(!response.ok){
        console.error("Failed to send log",response.status,response.statusText);
        }else{
        const reuslt = await response.json();
        console.log(`[$level.toUpperCase()] Log Created`,reuslt.logId,"-",reuslt.message);
        }
    }
    catch(error){
        console.error("Error while logging",error);
    }
}
MediaSourceHandle.exports = Log;