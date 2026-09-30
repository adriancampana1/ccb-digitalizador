import { AxiosError, AxiosHeaders, type AxiosAdapter } from "axios";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { client } from "../shared/api/client";
import type {
  Room,
  DocumentResponse,
  FolderOption,
} from "../shared/api/contracts";
export function startDemo() {
  const rooms: Room[] = [
    {
      id: "central",
      name: "Congregação Central",
      storageProvider: "sharepoint",
      authMode: "CREDENTIALS",
      connectionStatus: "CONNECTED",
      role: "MASTER",
      accessCode: "CCB-DEMO",
      baseFolderPath: "/Secretaria",
      status: "ACTIVE",
      connectedAccount: null,
    },
    {
      id: "jardim",
      name: "Jardim das Oliveiras",
      storageProvider: "google_drive",
      authMode: "OAUTH",
      connectionStatus: "CONNECTED",
      role: "MEMBER",
      accessCode: null,
      baseFolderPath: null,
      status: "ACTIVE",
      connectedAccount: "exemplo@congregacao.test",
    },
  ];
  const names = [
    "Ata da reunião administrativa",
    "Relatório de manutenção",
    "Comprovante de pagamento",
    "Relação de materiais",
    "Correspondência recebida",
    "Registro de patrimônio",
  ];
  const docs: Record<string, DocumentResponse[]> = {};
  const folders: Record<string, FolderOption[]> = {};
  const bytes = new Map<string, Blob>();
  for (const r of rooms) {
    folders[r.id] = [
      {
        id: `${r.id}-atas`,
        name: "Atas e reuniões",
        path: "Atas e reuniões",
        hasChildren: false,
      },
      {
        id: `${r.id}-financeiro`,
        name: "Financeiro",
        path: "Financeiro",
        hasChildren: false,
      },
      {
        id: `${r.id}-patrimonio`,
        name: "Patrimônio",
        path: "Patrimônio",
        hasChildren: false,
      },
    ];
    docs[r.id] = names.slice(0, r.id === "central" ? 6 : 2).map((title, i) => ({
      id: `${r.id}-${i}`,
      userId: "demo",
      title: r.id === "jardim" ? `${title} — Jardim` : title,
      documentType: "scanned",
      storageProvider: r.storageProvider,
      storageUrl: null,
      storageItemId: `item-${i}`,
      folderPath: i === 0 ? "Atas e reuniões" : i === 2 ? "Financeiro" : "",
      fileMetadata: {
        mimeType: "application/pdf",
        fileSize: 128000 + i * 41000,
        originalFileName: `${title}.pdf`,
      },
      thumbnailUrl: null,
      createdAt: new Date(2026, 8, 28 - i).toISOString(),
    }));
  }
  const providers = [
    {
      id: "sharepoint",
      displayName: "SharePoint",
      authMode: "CREDENTIALS",
      available: true,
      fields: [
        { name: "tenantId", label: "Tenant ID", required: true, secret: false },
        { name: "clientId", label: "Client ID", required: true, secret: false },
        {
          name: "clientSecret",
          label: "Client secret",
          required: true,
          secret: true,
        },
      ],
    },
    {
      id: "google_drive",
      displayName: "Google Drive",
      authMode: "OAUTH",
      available: true,
      fields: [],
    },
  ];
  const adapter: AxiosAdapter = async (config) => {
    const url = config.url ?? "";
    const method = config.method ?? "get";
    const body =
      typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    const roomId = String(config.headers?.["X-Room-Id"] ?? "central");
    let data: any;
    const headers = new AxiosHeaders();
    const fail = (message: string, status = 400) => {
      throw new AxiosError(message, "ERR_BAD_RESPONSE", config, undefined, {
        data: { message },
        status,
        statusText: message,
        headers,
        config,
      });
    };
    if (url.startsWith("/auth/")) {
      data = {
        accessToken: "demo-token",
        name: body.name || "Ana Oliveira",
        phone: body.phone,
        canCreateRooms: true,
        createdAt: "",
        updatedAt: "",
      };
    } else if (url === "/providers") data = providers;
    else if (url === "/rooms" && method === "get") data = rooms;
    else if (url === "/rooms" && method === "post") {
      const p = providers.find((p) => p.id === body.storageProvider)!;
      const room: Room = {
        id: crypto.randomUUID(),
        ...body,
        authMode: p.authMode,
        connectionStatus: p.authMode === "OAUTH" ? "PENDING" : "CONNECTED",
        role: "MASTER",
        accessCode: "CCB-DEMO",
        baseFolderPath: body.baseFolderPath ?? null,
        status: "ACTIVE",
        connectedAccount: null,
      };
      rooms.push(room);
      docs[room.id] = [];
      folders[room.id] = [];
      data = room;
    } else if (url === "/rooms/join") {
      if (body.accessCode !== "CCB-DEMO")
        fail("Código de demonstração: CCB-DEMO.");
      data = rooms[0];
    } else if (url.includes("/storage/oauth/url"))
      fail(
        "A autorização de um provedor real não está disponível na demonstração.",
      );
    else if (url.startsWith("/rooms/")) {
      const room = rooms.find(
        (r) => r.id === decodeURIComponent(url.split("/")[2]),
      );
      if (!room) fail("Sala não encontrada.", 404);
      if (method === "put") room!.connectionStatus = "CONNECTED";
      data = room;
    } else if (url === "/folders" && method === "get")
      data = {
        provider: rooms.find((r) => r.id === roomId)?.storageProvider,
        folders: (folders[roomId] ?? []).filter((f) => {
          const parent = f.path.includes("/")
            ? f.path.slice(0, f.path.lastIndexOf("/"))
            : "";
          return parent === (config.params?.folderPath ?? "");
        }),
      };
    else if (url === "/folders" && method === "post") {
      const folder = {
        id: crypto.randomUUID(),
        name: body.folderName,
        path: [body.parentPath, body.folderName].filter(Boolean).join("/"),
        hasChildren: false,
      };
      folders[roomId].push(folder);
      data = null;
    } else if (url.startsWith("/folders/")) {
      const id = decodeURIComponent(url.split("/")[2]);
      const folder = folders[roomId]?.find((f) => f.id === id);
      if (!folder) fail("Pasta não encontrada.", 404);
      if (method === "delete") {
        folders[roomId] = folders[roomId].filter((f) => f.id !== id);
      } else {
        const old = folder!.path;
        folder!.name = body.newName;
        folder!.path = old.includes("/")
          ? old.slice(0, old.lastIndexOf("/") + 1) + body.newName
          : body.newName;
        for (const d of docs[roomId])
          if (d.folderPath === old) d.folderPath = folder!.path;
      }
      data = null;
    } else if (url === "/document/search")
      data = (docs[roomId] ?? []).filter((d) =>
        d.title
          .toLocaleLowerCase()
          .includes(String(config.params.searchText).toLocaleLowerCase()),
      );
    else if (url === "/document" && method === "get") {
      const all = (docs[roomId] ?? []).filter(
        (d) =>
          config.params.folderPath === undefined ||
          d.folderPath === config.params.folderPath,
      );
      const page = Number(config.params.page ?? 0),
        size = Number(config.params.size ?? 10);
      data = {
        content: all.slice(page * size, (page + 1) * size),
        page,
        size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
        last: (page + 1) * size >= all.length,
      };
    } else if (url === "/document" && method === "post") {
      const form = body as FormData;
      const files = form.getAll("files") as File[];
      data = files.map((f, i) => {
        const id = crypto.randomUUID();
        bytes.set(id, f);
        const title = String(form.get("title") || f.name);
        return {
          id,
          userId: "demo",
          title: files.length > 1 ? `${title} ${i + 1}` : title,
          documentType: String(form.get("documentType")),
          storageProvider: String(form.get("storageProvider")),
          storageUrl: null,
          storageItemId: id,
          folderPath: String(form.get("folderPath") ?? ""),
          fileMetadata: {
            mimeType: f.type,
            fileSize: f.size,
            originalFileName: f.name,
          },
          thumbnailUrl: null,
          createdAt: new Date().toISOString(),
        };
      });
      docs[roomId].unshift(...data);
    } else if (url.startsWith("/document/")) {
      const id = decodeURIComponent(url.split("/")[2]);
      const doc = docs[roomId]?.find((d) => d.id === id);
      if (!doc) fail("Documento não encontrado.", 404);
      if (url.endsWith("/download")) {
        if (!bytes.has(id)) {
          const pdf = await PDFDocument.create();
          const p = pdf.addPage();
          const font = await pdf.embedFont(StandardFonts.Helvetica);
          p.drawText("DOCUMENTO FICTICIO - DEMONSTRACAO CCB", {
            x: 40,
            y: 760,
            size: 15,
            font,
          });
          bytes.set(
            id,
            new Blob([new Uint8Array(await pdf.save())], {
              type: "application/pdf",
            }),
          );
        }
        data = bytes.get(id);
        headers.set(
          "content-disposition",
          `attachment; filename*=UTF-8''${encodeURIComponent(doc!.fileMetadata.originalFileName)}`,
        );
      } else if (method === "delete") {
        docs[roomId] = docs[roomId].filter((d) => d.id !== id);
        data = null;
      } else data = doc;
    } else fail("Operação não disponível na demonstração.", 404);
    return {
      data:
        typeof data === "object" && !(data instanceof Blob)
          ? JSON.parse(JSON.stringify(data))
          : data,
      status: 200,
      statusText: "OK",
      headers,
      config,
    };
  };
  client.defaults.adapter = adapter;
}
