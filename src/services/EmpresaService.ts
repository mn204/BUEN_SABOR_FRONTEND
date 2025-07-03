import Empresa from "../models/Empresa";
const API_BASE = "http://localhost:8080/api/empresa";

class EmpresaService {
    async getEmpresaById(id: number): Promise<Empresa>{
        return await fetch(`${API_BASE}/${id}`).then(res => res.json());

    }

}

export default new EmpresaService;
