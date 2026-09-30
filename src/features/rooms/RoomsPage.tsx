import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Plus, ArrowRight, RefreshCw, Copy } from "lucide-react";
import { Button, Notice, Loading, EmptyState, Field } from "../../shared/ui";
import { useSession } from "../auth/sessionStore";
import { useRooms, switchRoom, loadRooms, usable } from "./roomStore";
import { joinRoom } from "./roomApi";
import { errorMessage } from "../../shared/api/error";
export function RoomStatus({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "CONNECTED" ? "success" : "warning"}`}>
      {status === "CONNECTED"
        ? "Conectada"
        : status === "PENDING"
          ? "Aguardando conexão"
          : "Desconectada"}
    </span>
  );
}
export function RoomsPage() {
  const { rooms, loading, error, activeRoomId } = useRooms();
  const session = useSession((s) => s.session)!;
  const navigate = useNavigate();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Minhas salas</h1>
          <p>Escolha a congregação em que deseja trabalhar.</p>
        </div>
        {session.canCreateRooms && (
          <Link className="button primary" to="/rooms/new">
            <Plus size={18} />
            <span className="desktop-label">Criar sala</span>
          </Link>
        )}
      </div>
      <div className="toolbar">
        <Link className="button secondary" to="/rooms/join">
          Entrar com código
          <ArrowRight size={16} />
        </Link>
        <Button
          variant="ghost"
          onClick={() => loadRooms()}
          aria-label="Atualizar salas"
        >
          <RefreshCw size={18} />
        </Button>
      </div>
      {error && <Notice>{error}</Notice>}
      {loading ? (
        <Loading />
      ) : !rooms.length ? (
        <EmptyState title="Seu trabalho começa em uma sala">
          Entre com o código fornecido pelo responsável da sua congregação.
        </EmptyState>
      ) : (
        <div className="surface">
          {rooms.map((room) => (
            <div className="room-row" key={room.id}>
              <Building2 size={24} />
              <div className="folder-name">
                <strong>{room.name}</strong>
                <small>
                  {room.storageProvider.replaceAll("_", " ")} ·{" "}
                  {room.role === "MASTER" ? "Master" : "Membro"}
                  {activeRoomId === room.id ? " · Sala ativa" : ""}
                </small>
              </div>
              <RoomStatus status={room.connectionStatus} />
              <div className="actions">
                <Link className="button ghost" to={`/rooms/${room.id}`}>
                  Detalhes
                </Link>
                {usable(room) && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (await switchRoom(room)) navigate("/documents");
                    }}
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
export function JoinRoomPage() {
  const ctx = useSession((s) => s.session)!;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <div className="form-page">
      <Link to="/rooms">Voltar às salas</Link>
      <h1 style={{ marginTop: 28 }}>Entrar em uma sala</h1>
      <p className="muted">
        Peça o código de acesso ao responsável da congregação.
      </p>
      {error && <Notice>{error}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const code = String(new FormData(e.currentTarget).get("code")).trim();
          setBusy(true);
          try {
            const room = await joinRoom(ctx, code);
            await loadRooms();
            if (usable(room)) await switchRoom(room);
            navigate(`/rooms/${room.id}`);
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Código de acesso"
          name="code"
          required
          minLength={4}
          placeholder="CCB-4X7K"
        />
        <Button type="submit" busy={busy}>
          Entrar na sala
        </Button>
      </form>
    </div>
  );
}
export function RoomDetail({
  connection,
}: {
  connection?: (
    room: import("../../shared/api/contracts").Room,
  ) => React.ReactNode;
}) {
  const { roomId } = useParams();
  const room = useRooms((s) => s.rooms.find((r) => r.id === roomId));
  const [copied, setCopied] = useState(false);
  if (!room)
    return (
      <EmptyState
        title="Sala não encontrada"
        action={<Link to="/rooms">Voltar às salas</Link>}
      >
        Atualize a lista para verificar seu acesso.
      </EmptyState>
    );
  return (
    <div className="form-page">
      <Link to="/rooms">Voltar às salas</Link>
      <div className="page-heading" style={{ marginTop: 28 }}>
        <div>
          <h1>{room.name}</h1>
          <p>
            {room.role === "MASTER"
              ? "Você é master desta sala."
              : "Você é membro desta sala."}
          </p>
        </div>
      </div>
      <div className="surface surface-pad">
        <RoomStatus status={room.connectionStatus} />
        <dl className="detail-list">
          <div>
            <dt>Armazenamento</dt>
            <dd>{room.storageProvider.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt>Pasta base</dt>
            <dd>{room.baseFolderPath || "Raiz do provedor"}</dd>
          </div>
          {room.connectedAccount && (
            <div>
              <dt>Conta conectada</dt>
              <dd>{room.connectedAccount}</dd>
            </div>
          )}
        </dl>
        {room.role === "MASTER" && room.accessCode && (
          <div style={{ marginTop: 24 }}>
            <p className="muted">Código de acesso</p>
            <div className="actions">
              <strong>{room.accessCode}</strong>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(room.accessCode!);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Copy size={16} />
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {connection?.(room)}
    </div>
  );
}
