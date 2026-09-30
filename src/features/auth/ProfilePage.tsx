import { Link } from "react-router-dom";
import { LogOut, Building2 } from "lucide-react";
import { useState } from "react";
import { Button, Dialog } from "../../shared/ui";
import { useSession, clearSession } from "./sessionStore";
import { useActiveRoom } from "../rooms/roomStore";
export default function ProfilePage() {
  const session = useSession((s) => s.session)!;
  const room = useActiveRoom();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="form-page">
      <div className="page-heading">
        <div>
          <h1>Minha conta</h1>
          <p>Seu acesso ao Digitalizador CCB.</p>
        </div>
      </div>
      <div className="surface surface-pad">
        <h2>{session.name}</h2>
        <dl className="detail-list">
          <div>
            <dt>Telefone</dt>
            <dd>{session.phone}</dd>
          </div>
          <div>
            <dt>Sala ativa</dt>
            <dd>{room?.name ?? "Nenhuma"}</dd>
          </div>
          <div>
            <dt>Papel nesta sala</dt>
            <dd>
              {room?.role === "MASTER" ? "Master" : room ? "Membro" : "—"}
            </dd>
          </div>
        </dl>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link to="/rooms" className="button secondary">
            <Building2 size={17} />
            Minhas salas
          </Link>
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            <LogOut size={17} />
            Sair da conta
          </Button>
        </div>
      </div>
      {confirm && (
        <Dialog title="Sair da conta?" onClose={() => setConfirm(false)}>
          <p>As páginas ainda não enviadas serão descartadas.</p>
          <div className="actions end">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={clearSession}>
              Sair
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
