import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function App(): JSX.Element {
  const getPrinters = () => {
    window.api.getPrinters()
  }

  const getPrintersNew = () => {
    window.api.getPrintersNew()
  }

  return (
    <div className="flex flex-row items-center justify-center p-16">
      <Card className="w-[350px]">
        <Button onClick={getPrinters} variant="outline">
          getPrinters
        </Button>
        <Button onClick={getPrintersNew} variant="outline">
          getPrintersNew
        </Button>
      </Card>
    </div>
  )
}

export default App
