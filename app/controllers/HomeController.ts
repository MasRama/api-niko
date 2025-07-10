import { Response, Request } from "../../type";

class Controller {
    
    public async index (request : Request, response : Response) { 
        return response.inertia("Landing", {});
    }
}

export default new Controller()
