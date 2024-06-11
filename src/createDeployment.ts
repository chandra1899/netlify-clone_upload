

const getProjectName = (url: string): string => {
    const projectNameWithGit = url.split('/').pop();
    const projectName = projectNameWithGit ? projectNameWithGit.replace('.git', '') : '';
    return projectName;
  }

export const createDeployment = async (email : string, repoUrl : string, id : string) => {
    try {
        await fetch('http://localhost:8000/api/createdeployment',{
            method:'POST',
            headers:{
              'Access-Control-Allow-Origin': '*',
              Accept:"application/json",
              "Content-Type":"application/json"
            },
            credentials:'include',
            body:JSON.stringify({
                email : email,
                deploymentId : id,
                status : "uploading",
                githubLink : repoUrl,
                deploymentLink : `${id}.example.com/index.html`,
                deploymentname : getProjectName(repoUrl)
            })
          })
    } catch (error) {
        console.log("error", error);
        
    }
}