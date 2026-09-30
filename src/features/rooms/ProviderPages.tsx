import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Field, Notice, Loading } from "../../shared/ui";
import type { Room, ProviderMetadata } from "../../shared/api/contracts";
import { useSession } from "../auth/sessionStore";
import { createRoom, listProviders, updateCredentials } from "./roomApi";
import { loadRooms } from "./roomStore";
import { connectProvider, checkConnection } from "./oauth";
import { errorMessage } from "../../shared/api/error";
function Credentials({ provider }: { provider: ProviderMetadata }) {
  return (
    <>
      {provider.fields.map((field) => (
        <Field
          key={field.name}
          label={field.label}
          name={field.name}
          type={field.secret ? "password" : "text"}
          required={field.required}
          autoComplete="off"
        />
      ))}
    </>
  );
}
export function CreateRoomPage() {
  const ctx = useSession((s) => s.session)!;
  const providers = useQuery({
    queryKey: ["session", ctx.sessionId, "providers"],
    queryFn: () => listProviders(ctx),
  });
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const provider = providers.data?.find((p) => p.id === selected);
  if (!ctx.canCreateRooms)
    return <Notice>Você não tem permissão para criar salas.</Notice>;
  return (
    <div className="form-page">
      <Link to="/rooms">Voltar às salas</Link>
      <h1 style={{ marginTop: 28 }}>Criar sala</h1>
      <p className="muted">
        Conecte o armazenamento da congregação e convide os membros.
      </p>
      {error && <Notice>{error}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!provider || busy) return;
          const data = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            const room = await createRoom(ctx, {
              name: String(data.get("name")).trim(),
              storageProvider: provider.id,
              baseFolderPath: String(data.get("base")).trim() || undefined,
              credentials:
                provider.authMode === "CREDENTIALS"
                  ? Object.fromEntries(
                      provider.fields.map((f) => [
                        f.name,
                        String(data.get(f.name)),
                      ]),
                    )
                  : undefined,
            });
            await loadRooms();
            navigate(`/rooms/${room.id}`);
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Nome da sala"
          name="name"
          required
          minLength={3}
          placeholder="Congregação Central"
        />
        <Field
          label="Pasta base (opcional)"
          name="base"
          placeholder="Deixe em branco para usar a raiz"
        />
        <div className="form-section">
          <h2>Armazenamento</h2>
          {providers.isLoading ? (
            <Loading />
          ) : providers.isError ? (
            <Notice>
              {errorMessage(providers.error)}{" "}
              <Button variant="ghost" onClick={() => providers.refetch()}>
                Tentar novamente
              </Button>
            </Notice>
          ) : (
            providers.data?.map((p) => (
              <div className="provider-option" key={p.id}>
                <input
                  id={`provider-${p.id}`}
                  type="radio"
                  name="provider"
                  value={p.id}
                  disabled={!p.available}
                  onChange={() => setSelected(p.id)}
                  checked={selected === p.id}
                />
                <label htmlFor={`provider-${p.id}`}>
                  {p.displayName}
                  <small>
                    {!p.available
                      ? "Indisponível"
                      : p.authMode === "OAUTH"
                        ? "Autorização com sua conta"
                        : "Conexão por credenciais"}
                  </small>
                </label>
              </div>
            ))
          )}
        </div>
        {provider?.authMode === "CREDENTIALS" && (
          <div className="form-section" key={provider.id}>
            <h2>Credenciais</h2>
            <Credentials provider={provider} />
          </div>
        )}
        {provider?.authMode === "OAUTH" && (
          <Notice kind="info">
            Depois de criar a sala, autorize o acesso à conta do provedor.
          </Notice>
        )}
        <Button type="submit" busy={busy} disabled={!provider?.available}>
          Criar sala
        </Button>
      </form>
    </div>
  );
}
export function ConnectionPanel({ room }: { room: Room }) {
  const ctx = useSession((s) => s.session)!;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const providers = useQuery({
    queryKey: ["session", ctx.sessionId, "providers"],
    queryFn: () => listProviders(ctx),
    enabled: room.role === "MASTER" && room.authMode === "CREDENTIALS",
  });
  useEffect(() => {
    const onFocus = () => {
      void loadRooms();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  const provider = providers.data?.find((p) => p.id === room.storageProvider);
  if (room.role !== "MASTER")
    return room.connectionStatus !== "CONNECTED" ? (
      <Notice kind="info">
        Peça ao master da sala para reconectar o armazenamento.
      </Notice>
    ) : null;
  return (
    <section className="form-section" style={{ marginTop: 28 }}>
      <h2>Conexão do armazenamento</h2>
      {error && <Notice>{error}</Notice>}
      {message && <Notice kind="info">{message}</Notice>}
      {room.authMode === "OAUTH" ? (
        <div className="actions">
          <Button
            busy={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await connectProvider(ctx, room.id);
                setMessage(
                  "Conclua a autorização na nova janela. Depois, atualize a conexão. Se o provedor retornar ao aplicativo nativo, o responsável precisa configurar o retorno web.",
                );
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Autorizar conta
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const status = await checkConnection(ctx, room.id);
                await loadRooms();
                setMessage(
                  status === "connected"
                    ? "Conta conectada."
                    : "A conexão ainda não foi confirmada pelo servidor.",
                );
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            Atualizar conexão
          </Button>
        </div>
      ) : (
        <>
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            Atualizar credenciais
          </Button>
          {editing &&
            (providers.isError ? (
              <Notice>{errorMessage(providers.error)}</Notice>
            ) : provider ? (
              <form
                style={{ marginTop: 24 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const data = new FormData(e.currentTarget);
                  try {
                    await updateCredentials(
                      ctx,
                      room.id,
                      Object.fromEntries(
                        provider.fields.map((f) => [
                          f.name,
                          String(data.get(f.name)),
                        ]),
                      ),
                    );
                    await loadRooms();
                    setEditing(false);
                    setMessage("Credenciais atualizadas.");
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Credentials provider={provider} />
                <Button type="submit" busy={busy}>
                  Salvar credenciais
                </Button>
              </form>
            ) : (
              <Loading />
            ))}
        </>
      )}
    </section>
  );
}
