import React, { useEffect, useState } from 'react'
import {
  PageHeader,
  ToastProvider,
  ToastConsumer,
  Spinner,
  Table,
  Layout,
  Card,
  EmptyState,
  Button,
  ModalDialog,
  Input,
} from 'vtex.styleguide'
import axios from 'axios'
import './style/admin.css'

interface ToastContext {
  showToast: (args: {
    message: string
    duration?: number
    horizontalPosition?: string
    verticalPosition?: string
  }) => void
}

interface Cookie {
  phrase: string
  id?: string
}

// Renderizador separado para la columna frase
const PhraseCellRenderer = ({ rowData }: { rowData: Cookie }) => (
  <span
    style={{
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      fontSize: '0.875rem',
      height: '100%',
      display: 'flex',
      minHeight: '1rem',
      alignItems: 'center',
    }}
  >
    {rowData.phrase}
  </span>
)
PhraseCellRenderer.displayName = 'PhraseCellRenderer'

// Renderizador separado para la columna acciones
const ActionsCellRenderer = ({
  rowData,
  setDeleteId,
  setDeleteModalOpen,
}: {
  rowData: Cookie
  setDeleteId: React.Dispatch<React.SetStateAction<string | null>>
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  if (!rowData?.id) return null

  return (
    <Button
      size="small"
      onClick={() => {
        setDeleteId(rowData.id!)
        setDeleteModalOpen(true)
      }}
      variation="danger-tertiary"
    >
      Eliminar
    </Button>
  )
}
ActionsCellRenderer.displayName = 'ActionsCellRenderer'

const FortuneCookieAdmin = () => {
  const [cookies, setCookies] = useState<Cookie[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newPhrase, setNewPhrase] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const ActionsCell = ({ rowData }: { rowData: Cookie }) => (
    <ActionsCellRenderer
      rowData={rowData}
      setDeleteId={setDeleteId}
      setDeleteModalOpen={setDeleteModalOpen}
    />
  )
  ActionsCell.displayName = 'ActionsCell'

  const schema = {
    properties: {
      phrase: {
        title: 'Frase de la Galleta',
        cellRenderer: PhraseCellRenderer,
      },
      actions: {
        title: <div style={{ textAlign: 'end', width: '100%' }}>Acciones</div>,
        width: 100,
        cellRenderer: ActionsCell,
      },
    },
  }

  const fetchCookies = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/_v/fortune-cookie-service/fortune')
      const data = res.data.fortune
      const formatted = data.map(
        (item: { CookieFortune: string; id: string }) => ({
          phrase: item.CookieFortune,
          id: item.id,
        })
      )
      setCookies([...formatted])
    } catch (err) {
      console.error('Error al obtener galletas:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveNewCookie = async (showToast: ToastContext['showToast']) => {
    if (!newPhrase.trim()) return
    setSaving(true)
    try {
      await axios.post('/_v/fortune-cookie-service/fortune', {
        CookieFortune: newPhrase,
      })
      await fetchCookies()
      setModalOpen(false)
      setNewPhrase('')
      showToast({
        message: '¡Galleta creada con éxito!',
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      })
    } catch (err) {
      console.error('Error al guardar galleta:', err)
      showToast({
        message: 'Error al crear la galleta.',
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteCookie = async (showToast: ToastContext['showToast']) => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await axios.delete(`/_v/fortune-cookie-service/fortune/${deleteId}`)
      await fetchCookies()
      setDeleteModalOpen(false)
      setDeleteId(null)
      showToast({
        message: '¡Galleta eliminada con éxito!',
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      })
    } catch (err) {
      console.error('Error al eliminar galleta:', err)
      showToast({
        message: 'Error al eliminar la galleta.',
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      })
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchCookies()
  }, [])

  return (
    <ToastProvider>
      <ToastConsumer>
        {(toastContext: ToastContext) => (
          <>
            <PageHeader
              title="Administrador de Galletas de la Fortuna"
              subtitle="Consulta o agrega nuevas frases de la fortuna"
            />

            <Layout page="admin-fortune" fullWidth padded>
              <Card className="pa5 card-content-centered">
                <div className="admin-container">
                  <div className="admin-content">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        paddingRight: '1rem',
                      }}
                      className="admin-header"
                    >
                      <span className="f4 b">
                        Frases de la fortuna existentes
                      </span>
                      <Button
                        onClick={() => setModalOpen(true)}
                        variation="primary"
                        className="add-button"
                      >
                        Agregar nueva galleta
                      </Button>
                    </div>

                    {loading ? (
                      <div className="flex justify-center pa7">
                        <Spinner />
                      </div>
                    ) : cookies.length > 0 ? (
                      <Table fullWidth items={cookies} schema={schema} />
                    ) : (
                      <div className="flex justify-center items-center pa8">
                        <EmptyState
                          title="No hay galletas registradas"
                          description="Agrega algunas frases para empezar"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Layout>

            <ModalDialog
              centered
              confirmation={{
                onClick: () => saveNewCookie(toastContext.showToast),
                label: saving ? 'Guardando...' : 'Guardar',
              }}
              cancelation={{
                onClick: () => setModalOpen(false),
                label: 'Cancelar',
              }}
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              loading={saving}
            >
              <div>
                <p className="mb4">Escribe una nueva frase de galleta:</p>
                <Input
                  value={newPhrase}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPhrase(e.target.value)
                  }
                  placeholder="La fortuna es..."
                  maxLength={200}
                  disabled={saving}
                />
              </div>
            </ModalDialog>

            <ModalDialog
              centered
              confirmation={{
                onClick: () => deleteCookie(toastContext.showToast),
                label: deleting ? 'Eliminando...' : 'Eliminar',
                loading: deleting,
              }}
              cancelation={{
                onClick: () => setDeleteModalOpen(false),
                label: 'Cancelar',
              }}
              isOpen={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              loading={deleting}
            >
              <div>¿Estás seguro que quieres eliminar esta galleta?</div>
            </ModalDialog>
          </>
        )}
      </ToastConsumer>
    </ToastProvider>
  )
}

export default FortuneCookieAdmin
